export type HuntRecord = {
	id: string;
	createdAt: string;
	rawText: string;
};

export type HuntMetric = {
	label: string;
	value: string;
};

export type View = "import" | "solo" | "party";
