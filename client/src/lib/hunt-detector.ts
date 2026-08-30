export type HuntReportType = "party" | "unknown";

const normalizeLabel = (label: string) => label.trim().toLowerCase();

const detectHuntReportType = (rawText: string): HuntReportType => {
	const lines = rawText.split(/\r?\n/).map((line) => line.trim());
	const hasLootType = lines.some((line) => /^Loot Type:\s*\S/i.test(line));
	const hasLeader = lines.some((line) => /\s+\(Leader\)$/i.test(line));
	if (hasLootType || hasLeader) {
		return "party";
	}

	return "unknown";
};

export { detectHuntReportType, normalizeLabel };
