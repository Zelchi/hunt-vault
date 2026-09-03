export type WikiPageDetails = {
	title: string;
	html: string;
	wikitext?: string;
	sourceUrl: string;
	imageUrl?: string;
};

export type CreatureSummary = {
	resistances: Array<{
		label: string;
		value: string;
		kind: "immune" | "strong" | "neutral" | "weak" | "healed";
		iconUrl?: string;
	}>;
	loot: string[];
};

export type CreatureResistance = CreatureSummary["resistances"][number];

export type ItemSummary = {
	attributes: Array<{
		label: string;
		value: string;
	}>;
	description?: string;
	sources: Array<{
		label: string;
		value: string;
	}>;
};

export type ImbuementSummary = {
	attributes: Array<{
		label: string;
		value: string;
	}>;
	effects: Array<{
		label: string;
		value: string;
	}>;
	materials: Array<{
		label: string;
		value: string;
		imageUrl: string | undefined;
	}>;
};
