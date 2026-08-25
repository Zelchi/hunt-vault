import type { HuntMetric } from "@/types/hunt-common";

export type HuntListItem = {
	quantity: string;
	name: string;
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
