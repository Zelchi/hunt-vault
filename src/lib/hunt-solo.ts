import { normalizeLabel } from "@/lib/hunt-detector";
import type { HuntMetric } from "@/types/hunt-common";
import type { HuntListItem, HuntSoloParseResult, ParsedHuntSolo } from "@/types/hunt-solo";

const knownMetricLabels = new Set([
	"raw xp gain",
	"xp gain",
	"xp/h",
	"raw xp/h",
	"loot",
	"supplies",
	"balance",
	"damage",
	"damage/h",
	"healing",
	"healing/h",
]);

const parseListItem = (line: string): HuntListItem | null => {
	const match = line.trim().match(/^(\d[\d.,]*)x\s+(.+)$/i);
	if (!match) {
		return null;
	}
	return {
		quantity: match[1],
		name: match[2].trim(),
	};
};

const parseHuntSoloReport = (rawText: string): ParsedHuntSolo => {
	const metrics: HuntMetric[] = [];
	const monsters: HuntListItem[] = [];
	const lootedItems: HuntListItem[] = [];
	let sessionData = "";
	let session = "";
	let section: "metrics" | "monsters" | "lootedItems" = "metrics";

	for (const rawLine of rawText.split(/\r?\n/)) {
		const line = rawLine.trim();

		if (!line) {
			continue;
		}

		const sessionDataMatch = line.match(/^Session data:\s*(.*)$/i);
		if (sessionDataMatch) {
			sessionData = sessionDataMatch[1].trim();
			section = "metrics";
			continue;
		}

		if (/^Killed Monsters:\s*$/i.test(line)) {
			section = "monsters";
			continue;
		}

		if (/^Looted Items:\s*$/i.test(line)) {
			section = "lootedItems";
			continue;
		}

		const sessionMatch = line.match(/^Session:\s*(.*)$/i);
		if (sessionMatch) {
			session = sessionMatch[1].trim();
			section = "metrics";
			continue;
		}

		if (section === "monsters") {
			const item = parseListItem(line);
			if (item) {
				monsters.push(item);
			}
			continue;
		}

		if (section === "lootedItems") {
			const item = parseListItem(line);
			if (item) {
				lootedItems.push(item);
			}
			continue;
		}

		const metricMatch = line.match(/^([^:]+):\s*(.+)$/);
		if (metricMatch) {
			metrics.push({
				label: metricMatch[1].trim(),
				value: metricMatch[2].trim(),
			});
		}
	}

	return {
		sessionData,
		session,
		metrics,
		monsters,
		lootedItems,
	};
};

const validateHuntSoloReport = (rawText: string): HuntSoloParseResult => {
	const parsed = parseHuntSoloReport(rawText);
	const lines = rawText.split(/\r?\n/).map((line) => line.trim());
	const errors: string[] = [];

	const hasSessionData = lines.some((line) => {
		return /^Session data:\s*\S/i.test(line);
	});
	const hasSession = lines.some((line) => {
		return /^Session:\s*\S/i.test(line);
	});
	const killedMonstersIndex = lines.findIndex((line) => {
		return /^Killed Monsters:\s*$/i.test(line);
	});
	const lootedItemsIndex = lines.findIndex((line) => {
		return /^Looted Items:\s*$/i.test(line);
	});
	const knownMetrics = parsed.metrics.filter((metric) => {
		return knownMetricLabels.has(normalizeLabel(metric.label));
	}).length;

	let extractedDataCount = 0;
	extractedDataCount += parsed.metrics.length;
	extractedDataCount += parsed.monsters.length;
	extractedDataCount += parsed.lootedItems.length;

	if (!hasSessionData) {
		errors.push("não encontrei a linha Session data");
	}

	if (!hasSession) {
		errors.push("não encontrei a linha Session");
	}

	if (killedMonstersIndex === -1) {
		errors.push("não encontrei a seção Killed Monsters");
	}

	if (lootedItemsIndex === -1) {
		errors.push("não encontrei a seção Looted Items");
	}

	if (killedMonstersIndex !== -1 && lootedItemsIndex !== -1 && lootedItemsIndex < killedMonstersIndex) {
		errors.push("as seções Killed Monsters e Looted Items estão fora de ordem");
	}

	if (knownMetrics < 2) {
		errors.push("não consegui extrair pelo menos duas métricas conhecidas");
	}

	if (extractedDataCount === 0) {
		errors.push("nenhum dado reconhecível foi extraído");
	}

	return {
		parsed,
		errors,
	};
};

const formatCreatedAt = (createdAt: string) => {
	return new Date(createdAt).toLocaleString("pt-BR", {
		dateStyle: "medium",
		timeStyle: "short",
	});
};

export { formatCreatedAt, parseHuntSoloReport, validateHuntSoloReport };
