import type { EntityCatalog, EntitySearchFilter, EntitySearchResult } from "@/type/entity";
import type { CreatureResistance } from "@/type/entity-details";

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

export const CREATURE_RESISTANCE_KIND_LABEL: Record<CreatureResistance["kind"], string> = {
	immune: "Imune",
	strong: "Resistente",
	neutral: "Neutro",
	weak: "Vulnerável",
	healed: "Cura",
};

export const EMPTY_ENTITY_CATALOG: EntityCatalog = {
	monsters: [],
	spells: [],
	runes: [],
	imbuements: [],
};
