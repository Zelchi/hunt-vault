export type HuntReportType = "party" | "solo" | "unknown";

const knownPartyMetricLabels = new Set(["loot", "supplies", "balance", "damage", "healing"]);

const normalizeLabel = (label: string) => label.trim().toLowerCase();

const detectHuntReportType = (rawText: string): HuntReportType => {
	const lines = rawText.split(/\r?\n/).map((line) => line.trim());
	const hasLootType = lines.some((line) => /^Loot Type:\s*\S/i.test(line));
	const hasLeader = lines.some((line) => /\s+\(Leader\)$/i.test(line));
	const hasPartyMetric = lines.some((line) => {
		if (!/^[^:]+:\s*.+$/.test(line)) {
			return false;
		}

		return knownPartyMetricLabels.has(normalizeLabel(line.split(":")[0]));
	});
	const hasSoloSection = lines.some((line) => {
		return /^Killed Monsters:\s*$|^Looted Items:\s*$/i.test(line);
	});

	if (hasLootType || hasLeader || (hasPartyMetric && !hasSoloSection)) {
		return "party";
	}

	if (hasSoloSection) {
		return "solo";
	}

	return "unknown";
};

export { detectHuntReportType, normalizeLabel };