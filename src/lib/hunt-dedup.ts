import { detectHuntReportType } from "@/lib/hunt-detector";
import type { HuntRecord } from "@/types/hunt-common";

const normalizeReportText = (rawText: string) => {
	return rawText
		.split(/\r?\n/)
		.map((line) => line.trim().replace(/\s+/g, " ").toLowerCase())
		.filter(Boolean)
		.join("\n");
};

const getSessionDataSignature = (rawText: string) => {
	const sessionDataLine = rawText.split(/\r?\n/).find((line) => /^\s*Session data:\s*\S/i.test(line));
	return (
		sessionDataLine
			?.replace(/^\s*Session data:\s*/i, "")
			.trim()
			.replace(/\s+/g, " ")
			.toLowerCase() ?? null
	);
};

const getHuntFingerprint = (rawText: string) => {
	const type = detectHuntReportType(rawText);
	const sessionData = getSessionDataSignature(rawText);

	if (sessionData) {
		return `${type}|session-data|${sessionData}`;
	}

	return `${type}|content|${normalizeReportText(rawText)}`;
};

const hasDuplicateHunt = (history: HuntRecord[], rawText: string) => {
	const fingerprint = getHuntFingerprint(rawText);
	return history.some((record) => getHuntFingerprint(record.rawText) === fingerprint);
};

export { getHuntFingerprint, hasDuplicateHunt };
