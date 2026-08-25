export type PartyMetric = {
	label: string;
	value: string;
};

export type PartyMember = {
	name: string;
	isLeader: boolean;
	metrics: PartyMetric[];
};

export type ParsedHuntParty = {
	sessionData: string;
	session: string;
	lootType: string;
	metrics: PartyMetric[];
	members: PartyMember[];
};

export type HuntPartyParseResult = {
	parsed: ParsedHuntParty;
	errors: string[];
};
