import { detectHuntReportType } from "@/lib/hunt-detector";
import type { HuntRecord } from "@/type/hunt-common";

const normalizeReportText = (rawText: string) => {
	return rawText
		.split(/\r?\n/)
		.map((line) => {
			return line.trim().replace(/\s+/g, " ").toLowerCase();
		})
		.filter(Boolean)
		.join("\n");
};

const getSessionDataSignature = (rawText: string) => {
	const sessionDataLine = rawText.split(/\r?\n/).find((line) => {
		return /^\s*Session data:\s*\S/i.test(line);
	});
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

const hasDuplicateHunt = (history: HuntRecord[], rawText: string, fingerprint?: string) => {
	const reportFingerprint = getHuntFingerprint(rawText);
	return history.some((record) => {
		if (fingerprint && record.fingerprint === fingerprint) {
			return true;
		}
		return getHuntFingerprint(record.rawText) === reportFingerprint;
	});
};

export { getHuntFingerprint, hasDuplicateHunt };
