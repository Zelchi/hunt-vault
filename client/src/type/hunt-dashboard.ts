export type MetricKey = "loot" | "supplies" | "damage" | "healing";

export type MetricConfig = {
	key: MetricKey;
	title: string;
	description: string;
	aliases: string[];
	color: string;
};
