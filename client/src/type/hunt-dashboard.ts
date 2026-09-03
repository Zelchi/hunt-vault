import type { HuntMetric, HuntRecord } from "@/type/hunt-common";
import type { ParsedHuntParty, PartyMember } from "@/type/hunt-party";

export type MetricKey = "loot" | "supplies" | "damage" | "healing";

export type MetricConfig = {
	key: MetricKey;
	title: string;
	description: string;
	aliases: string[];
	color: string;
};

export type ParsedPartyHunt = {
	record: HuntRecord;
	parsed: ParsedHuntParty;
};

export type HuntWithMetrics = {
	parsed: { metrics: HuntMetric[] };
};

export type HuntSummary = {
	count: number;
	loot: number;
	supplies: number;
	damage: number;
	healing: number;
};

export type MemberSummary = {
	name: string;
	hunts: number;
	durationHours: number;
	normalizedDamage: number;
	normalizedHealing: number;
	normalizedSupplies: number;
	normalizedProfit: number;
};

export type MemberAverageMetric = "damage" | "healing" | "supplies" | "profit";

export type PartyRanking = {
	member: PartyMember;
	metric: HuntMetric;
};

export type PartyRankings = {
	supplies: PartyRanking | null;
	damage: PartyRanking | null;
	healing: PartyRanking | null;
};
