import type { MetricConfig } from "@/type/hunt-dashboard";

export const PARTY_METRICS: MetricConfig[] = [
	{
		key: "loot",
		title: "Loot da PT",
		description: "Loot total de cada Party Hunt",
		aliases: ["Loot"],
		color: "#8ba66f",
	},
	{
		key: "supplies",
		title: "Supplies da PT",
		description: "Supplies gastos em cada Party Hunt",
		aliases: ["Supplies"],
		color: "#e0a85d",
	},
	{
		key: "damage",
		title: "Dano da PT",
		description: "Dano total de cada Party Hunt",
		aliases: ["Damage"],
		color: "#e05d5d",
	},
	{
		key: "healing",
		title: "Healing da PT",
		description: "Healing total de cada Party Hunt",
		aliases: ["Healing"],
		color: "#a9c38a",
	},
];

export const PARTY_CHART_METRICS = PARTY_METRICS.filter((config) => {
	return config.key !== "healing";
});
