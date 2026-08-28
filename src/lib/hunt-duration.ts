const parseDurationSeconds = (value: string): number | undefined => {
	const normalized = value.trim().toLowerCase();
	const clockMatch = normalized.match(/^(\d+):(\d{2})(?::(\d{2}))?h?$/);

	if (clockMatch) {
		const hours = Number(clockMatch[1]);
		const minutes = Number(clockMatch[2]);
		const seconds = Number(clockMatch[3] ?? 0);
		return hours * 3600 + minutes * 60 + seconds;
	}

	const textMatch = normalized.match(/^(?:(\d+(?:\.\d+)?)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/);
	if (!textMatch || (!textMatch[1] && !textMatch[2] && !textMatch[3])) {
		return undefined;
	}

	return Number(textMatch[1] ?? 0) * 3600 + Number(textMatch[2] ?? 0) * 60 + Number(textMatch[3] ?? 0);
};

const parseSessionDataDuration = (value: string): number | undefined => {
	const match = value.match(/From\s+(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2}:\d{2})\s+to\s+(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2}:\d{2})/i);
	if (!match) {
		return undefined;
	}

	const start = Date.parse(`${match[1]}T${match[2]}`);
	const end = Date.parse(`${match[3]}T${match[4]}`);
	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
		return undefined;
	}

	return (end - start) / 1000;
};

const resolveHuntDurationSeconds = (sessionData: string, displayedDuration?: string) => {
	return parseSessionDataDuration(sessionData) ?? parseDurationSeconds(displayedDuration ?? "") ?? 3600;
};

export { parseDurationSeconds, parseSessionDataDuration, resolveHuntDurationSeconds };
