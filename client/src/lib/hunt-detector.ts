import type { HuntReportType } from "@/type/hunt-detector";

const normalizeLabel = (label: string) => {
	return label.trim().toLowerCase();
};

const detectHuntReportType = (rawText: string): HuntReportType => {
	const lines = rawText.split(/\r?\n/).map((line) => {
		return line.trim();
	});
	const hasLootType = lines.some((line) => {
		return /^Loot Type:\s*\S/i.test(line);
	});
	const hasLeader = lines.some((line) => {
		return /\s+\(Leader\)$/i.test(line);
	});
	if (hasLootType || hasLeader) {
		return "party";
	}

	return "unknown";
};

export { detectHuntReportType, normalizeLabel };
