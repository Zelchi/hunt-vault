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

export type ParsedHuntSolo = {
	sessionData: string;
	session: string;
	metrics: HuntMetric[];
	monsters: HuntListItem[];
	lootedItems: HuntListItem[];
};

export type HuntSoloParseResult = {
	parsed: ParsedHuntSolo;
	errors: string[];
};
