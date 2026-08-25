export type HuntRecord = {
	id: string;
	createdAt: string;
	rawText: string;
};

export type View = "import" | "visualize";

export type HuntListItem = {
	quantity: string;
	name: string;
};

export type HuntMetric = {
	label: string;
	value: string;
};

export type ParsedHunt = {
	sessionData: string;
	session: string;
	metrics: HuntMetric[];
	monsters: HuntListItem[];
	lootedItems: HuntListItem[];
};

export type HuntParseResult = {
	parsed: ParsedHunt;
	errors: string[];
};
