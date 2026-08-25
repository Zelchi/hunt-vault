import type { HuntPartyParseResult, ParsedHuntParty, PartyMember, PartyMetric } from "@/types/hunt-party";

const knownPartyMetricLabels = new Set(["loot", "supplies", "balance", "damage", "healing"]);

const normalizeLabel = (label: string) => label.trim().toLowerCase();

const parseMetric = (line: string): PartyMetric | null => {
	const match = line.match(/^([^:]+):\s*(.+)$/);

	if (!match) {
		return null;
	}

	return {
		label: match[1].trim(),
		value: match[2].trim(),
	};
};

const isNumericValue = (value: string) => {
	return /^-?\d[\d.,]*$/.test(value.trim());
};

const parseHuntPartyReport = (rawText: string): ParsedHuntParty => {
	const metrics: PartyMetric[] = [];
	const members: PartyMember[] = [];
	let sessionData = "";
	let session = "";
	let lootType = "";
	let currentMember: PartyMember | null = null;

	const flushMember = () => {
		if (currentMember) {
			members.push(currentMember);
			currentMember = null;
		}
	};

	for (const rawLine of rawText.split(/\r?\n/)) {
		const line = rawLine.trim();

		if (!line) {
			continue;
		}

		const sessionDataMatch = line.match(/^Session data:\s*(.*)$/i);
		if (sessionDataMatch) {
			flushMember();
			sessionData = sessionDataMatch[1].trim();
			continue;
		}

		const sessionMatch = line.match(/^Session:\s*(.*)$/i);
		if (sessionMatch) {
			flushMember();
			session = sessionMatch[1].trim();
			continue;
		}

		const lootTypeMatch = line.match(/^Loot Type:\s*(.*)$/i);
		if (lootTypeMatch) {
			flushMember();
			lootType = lootTypeMatch[1].trim();
			continue;
		}

		const metric = parseMetric(line);
		if (metric) {
			if (currentMember) {
				currentMember.metrics.push(metric);
			} else {
				metrics.push(metric);
			}
			continue;
		}

		flushMember();
		const isLeader = /\s+\(Leader\)$/i.test(line);
		const name = line.replace(/\s+\(Leader\)$/i, "").trim();

		if (name) {
			currentMember = {
				name,
				isLeader,
				metrics: [],
			};
		}
	}

	flushMember();

	return {
		sessionData,
		session,
		lootType,
		metrics,
		members,
	};
};

const validateHuntPartyReport = (rawText: string): HuntPartyParseResult => {
	const parsed = parseHuntPartyReport(rawText);
	const errors: string[] = [];
	const lines = rawText.split(/\r?\n/).map((line) => line.trim());
	const knownMetrics = parsed.metrics.filter((metric) => {
		return knownPartyMetricLabels.has(normalizeLabel(metric.label));
	});
	const membersWithMetrics = parsed.members.filter((member) => {
		return member.metrics.length > 0;
	});
	const hasSessionData = lines.some((line) => {
		return /^Session data:\s*\S/i.test(line);
	});
	const hasSession = lines.some((line) => {
		return /^Session:\s*\S/i.test(line);
	});
	const hasLootType = lines.some((line) => {
		return /^Loot Type:\s*\S/i.test(line);
	});

	if (!hasSessionData) {
		errors.push("não encontrei a linha Session data");
	}

	if (!hasSession) {
		errors.push("não encontrei a linha Session");
	}

	if (!hasLootType) {
		errors.push("não encontrei a linha Loot Type");
	}

	if (knownMetrics.length < 3) {
		errors.push("não consegui extrair pelo menos três métricas gerais conhecidas");
	}

	if (parsed.members.length === 0) {
		errors.push("não encontrei nenhum membro da party");
	}

	if (membersWithMetrics.length !== parsed.members.length) {
		errors.push("um ou mais membros não possuem métricas extraíveis");
	}

	if (!parsed.members.some((member) => member.isLeader)) {
		errors.push("não encontrei um membro marcado como Leader");
	}

	const invalidValues = [...parsed.metrics, ...parsed.members.flatMap((member) => member.metrics)].filter((metric) => {
		return !isNumericValue(metric.value);
	});

	if (invalidValues.length > 0) {
		errors.push("existem métricas com valores numéricos inválidos");
	}

	return { parsed, errors };
};

export { parseHuntPartyReport, validateHuntPartyReport };
