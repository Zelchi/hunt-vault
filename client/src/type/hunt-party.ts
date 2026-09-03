import type { HuntMetric } from "@/type/hunt-common";

export type PartyMember = {
	name: string;
	isLeader: boolean;
	metrics: HuntMetric[];
};

export type ParsedHuntParty = {
	sessionData: string;
	session: string;
	durationSeconds: number;
	lootType: string;
	metrics: HuntMetric[];
	members: PartyMember[];
};

export type HuntPartyParseResult = {
	parsed: ParsedHuntParty;
	errors: string[];
};
