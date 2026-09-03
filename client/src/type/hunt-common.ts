export type HuntRecord = {
	id: string;
	createdAt: string;
	rawText: string;
	fingerprint?: string;
};

export type HuntSyncMutation = {
	fingerprint: string;
	mutationId: string;
	action: "upsert" | "delete";
	sessionData?: string;
	members?: string[];
	payload?: {
		createdAt: string;
		rawText: string;
	};
};

export type HuntSyncState = {
	key: string;
	value: string;
};

export type HuntMetric = {
	label: string;
	value: string;
};

export type View = "import" | "party";
