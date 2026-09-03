import { PARTY_CHART_METRICS as partyChartMetrics, PARTY_METRICS as partyMetrics } from "@/const/hunt-dashboard";
import { validateHuntPartyReport } from "@/lib/hunt-party";
import type { HuntMetric, HuntRecord } from "@/type/hunt-common";
import type {
	HuntSummary,
	HuntWithMetrics,
	MemberAverageMetric,
	MemberSummary,
	MetricConfig,
	MetricKey,
	ParsedPartyHunt,
	PartyRanking,
	PartyRankings,
} from "@/type/hunt-dashboard";
import type { ParsedHuntParty } from "@/type/hunt-party";

const normalizeMetricLabel = (label: string) => {
	return label
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "");
};

const parseNumericValue = (value: string): number => {
	const raw = value.trim().replace(/\s/g, "");
	const sign = raw.startsWith("-") ? -1 : 1;
	const unsigned = raw.replace(/[^\d.,]/g, "");
	if (!unsigned) {
		return 0;
	}

	const lastComma = unsigned.lastIndexOf(",");
	const lastDot = unsigned.lastIndexOf(".");
	const lastSeparator = Math.max(lastComma, lastDot);
	const separatorCount = (unsigned.match(/[.,]/g) ?? []).length;
	const digitsAfterSeparator = lastSeparator === -1 ? 0 : unsigned.length - lastSeparator - 1;

	if (separatorCount > 1 || digitsAfterSeparator === 3) {
		return sign * Number(unsigned.replace(/[.,]/g, ""));
	}

	const normalized = unsigned.replace(",", ".");
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? sign * parsed : 0;
};

const findMetricValue = (metrics: HuntMetric[], aliases: readonly string[]): number | undefined => {
	const normalizedAliases = aliases.map(normalizeMetricLabel);
	const metric = metrics.find((item) => {
		return normalizedAliases.includes(normalizeMetricLabel(item.label));
	});
	return metric ? parseNumericValue(metric.value) : undefined;
};

const metricValue = (metrics: HuntMetric[], aliases: readonly string[]) => {
	return findMetricValue(metrics, aliases) ?? 0;
};

const parsePartyHunts = (history: HuntRecord[]): ParsedPartyHunt[] => {
	return history
		.map((record) => {
			try {
				const validation = validateHuntPartyReport(record.rawText);
				if (validation.errors.length === 0) {
					return { record, parsed: validation.parsed };
				}
			} catch {
				return null;
			}
			return null;
		})
		.filter((hunt): hunt is ParsedPartyHunt => {
			return hunt !== null;
		})
		.sort((a, b) => {
			return new Date(a.record.createdAt).getTime() - new Date(b.record.createdAt).getTime();
		});
};

const summarizeHunts = (hunts: HuntWithMetrics[], configs: MetricConfig[]): HuntSummary => {
	const getTotal = (key: MetricKey) => {
		const config = configs.find((item) => {
			return item.key === key;
		});
		return config
			? hunts.reduce((total, hunt) => {
					return total + metricValue(hunt.parsed.metrics, config.aliases);
				}, 0)
			: 0;
	};

	return {
		count: hunts.length,
		loot: getTotal("loot"),
		supplies: getTotal("supplies"),
		damage: getTotal("damage"),
		healing: getTotal("healing"),
	};
};

const getPartyMetricValue = (hunt: ParsedPartyHunt, config: MetricConfig) => {
	if (config.key === "damage" || config.key === "healing") {
		return hunt.parsed.members.reduce((total, member) => {
			return total + metricValue(member.metrics, config.aliases);
		}, 0);
	}

	const overallValue = findMetricValue(hunt.parsed.metrics, config.aliases);
	if (overallValue !== undefined) {
		return overallValue;
	}

	return hunt.parsed.members.reduce((total, member) => {
		return total + metricValue(member.metrics, config.aliases);
	}, 0);
};

const getPartyMetricValues = (hunts: ParsedPartyHunt[], config: MetricConfig) => {
	return hunts.map((hunt) => {
		return getPartyMetricValue(hunt, config);
	});
};

const normalizeValueToHour = (value: number, durationSeconds: number) => {
	return value * (3600 / Math.max(durationSeconds, 1));
};

const getPartyHourlyValues = (hunts: ParsedPartyHunt[], config: MetricConfig) => {
	return hunts.map((hunt) => {
		return normalizeValueToHour(getPartyMetricValue(hunt, config), hunt.parsed.durationSeconds);
	});
};

const aggregatePartyMembers = (hunts: ParsedPartyHunt[]): MemberSummary[] => {
	const members = new Map<string, MemberSummary>();

	for (const hunt of hunts) {
		for (const member of hunt.parsed.members) {
			const key = member.name.trim().toLowerCase();
			const existing = members.get(key);
			const damage = findMetricValue(member.metrics, ["Damage"]);
			const healing = findMetricValue(member.metrics, ["Healing"]);
			const supplies = findMetricValue(member.metrics, ["Supplies"]);
			const partyLoot =
				findMetricValue(hunt.parsed.metrics, ["Loot"]) ??
				hunt.parsed.members.reduce((total, partyMember) => {
					return total + metricValue(partyMember.metrics, ["Loot"]);
				}, 0);
			const partySupplies = hunt.parsed.members.reduce((total, partyMember) => {
				return total + metricValue(partyMember.metrics, ["Supplies"]);
			}, 0);
			const equalProfitShare = (partyLoot - partySupplies) / Math.max(hunt.parsed.members.length, 1);
			const memberPayout = (supplies ?? 0) + equalProfitShare;
			const summary = existing ?? {
				name: member.name,
				hunts: 0,
				durationHours: 0,
				normalizedDamage: 0,
				normalizedHealing: 0,
				normalizedSupplies: 0,
				normalizedProfit: 0,
			};

			summary.hunts += 1;
			summary.durationHours += hunt.parsed.durationSeconds / 3600;
			summary.normalizedDamage += normalizeValueToHour(damage ?? 0, hunt.parsed.durationSeconds);
			summary.normalizedHealing += normalizeValueToHour(healing ?? 0, hunt.parsed.durationSeconds);
			summary.normalizedSupplies += normalizeValueToHour(supplies ?? 0, hunt.parsed.durationSeconds);
			summary.normalizedProfit += normalizeValueToHour(memberPayout, hunt.parsed.durationSeconds);
			members.set(key, summary);
		}
	}

	return Array.from(members.values()).sort((a, b) => {
		return getMemberAverage(b, "damage") - getMemberAverage(a, "damage");
	});
};

const calculatePartySummary = (hunts: ParsedPartyHunt[]): HuntSummary => {
	const summary = summarizeHunts(hunts, partyMetrics);
	const damageConfig = partyMetrics.find((config) => {
		return config.key === "damage";
	});
	const healingConfig = partyMetrics.find((config) => {
		return config.key === "healing";
	});

	return {
		...summary,
		damage: damageConfig
			? hunts.reduce((total, hunt) => {
					return total + getPartyMetricValue(hunt, damageConfig);
				}, 0)
			: 0,
		healing: healingConfig
			? hunts.reduce((total, hunt) => {
					return total + getPartyMetricValue(hunt, healingConfig);
				}, 0)
			: 0,
	};
};

const calculatePartyHourlyAverages = (hunts: ParsedPartyHunt[]) => {
	const average = (key: MetricKey) => {
		const config = partyMetrics.find((item) => {
			return item.key === key;
		});
		if (!config || hunts.length === 0) {
			return 0;
		}

		const normalizedTotal = hunts.reduce((total, hunt) => {
			return total + normalizeValueToHour(getPartyMetricValue(hunt, config), hunt.parsed.durationSeconds);
		}, 0);

		return normalizedTotal / hunts.length;
	};

	return {
		loot: average("loot"),
		supplies: average("supplies"),
		damage: average("damage"),
		healing: average("healing"),
	};
};

const countPartyMembers = (hunts: ParsedPartyHunt[]) => {
	return new Set(
		hunts.flatMap((hunt) => {
			return hunt.parsed.members.map((member) => {
				return member.name.trim().toLowerCase();
			});
		}),
	).size;
};

const getAverageValue = (total: number, count: number) => {
	return count > 0 ? total / count : 0;
};

const getMemberAverage = (member: MemberSummary | undefined, metric: MemberAverageMetric) => {
	if (!member) {
		return 0;
	}

	const total =
		metric === "damage"
			? member.normalizedDamage
			: metric === "healing"
				? member.normalizedHealing
				: metric === "supplies"
					? member.normalizedSupplies
					: member.normalizedProfit;

	return getAverageValue(total, member.hunts);
};

const getBestPartyMember = (members: MemberSummary[], metric: MemberAverageMetric, ascending = false) => {
	return [...members].sort((a, b) => {
		const difference = getMemberAverage(a, metric) - getMemberAverage(b, metric);
		return ascending ? difference : -difference;
	})[0];
};

const getPartyRankings = (party: ParsedHuntParty | null): PartyRankings | null => {
	if (!party) {
		return null;
	}

	const getTopMember = (metricLabel: string, ascending: boolean): PartyRanking | null => {
		const memberMetrics = party.members
			.map((member) => {
				const metric = member.metrics.find((item) => {
					return normalizeMetricLabel(item.label) === normalizeMetricLabel(metricLabel);
				});
				return metric ? { member, metric } : null;
			})
			.filter((item): item is PartyRanking => {
				return item !== null;
			});

		return (
			[...memberMetrics].sort((a, b) => {
				const difference = parseNumericValue(a.metric.value) - parseNumericValue(b.metric.value);
				return ascending ? difference : -difference;
			})[0] ?? null
		);
	};

	return {
		supplies: getTopMember("supplies", true),
		damage: getTopMember("damage", false),
		healing: getTopMember("healing", false),
	};
};

const formatNumber = (value: number) => {
	return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Math.round(value));
};

const formatSignedNumber = (value: number) => {
	return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
};

export {
	aggregatePartyMembers,
	calculatePartyHourlyAverages,
	calculatePartySummary,
	countPartyMembers,
	findMetricValue,
	formatNumber,
	formatSignedNumber,
	getAverageValue,
	getBestPartyMember,
	getMemberAverage,
	getPartyHourlyValues,
	getPartyMetricValue,
	getPartyMetricValues,
	getPartyRankings,
	metricValue,
	normalizeMetricLabel,
	normalizeValueToHour,
	parseNumericValue,
	parsePartyHunts,
	partyChartMetrics,
	partyMetrics,
	summarizeHunts,
};
