import type { EntitySearchResult } from "@/lib/entity-search";

export type EntitySearchFilter = "boss" | EntitySearchResult["kind"];

export const ENTITY_KIND_LABEL: Record<EntitySearchResult["kind"], string> = {
	monster: "Criatura",
	spell: "Habilidade",
	rune: "Runa",
	item: "Item",
	imbuement: "Imbuement",
	hunt: "Hunt",
};

export const ENTITY_SEARCH_FILTERS: Array<{ value: EntitySearchFilter; label: string }> = [
	{ value: "imbuement", label: "Imbuements" },
	{ value: "rune", label: "Runas" },
	{ value: "spell", label: "Habilidades" },
	{ value: "boss", label: "Bosses" },
	{ value: "monster", label: "Criaturas" },
	{ value: "hunt", label: "Hunts" },
	{ value: "item", label: "Itens" },
];
