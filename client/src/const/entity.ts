import type { EntitySearchResult } from "@/lib/entity-search";

export const ENTITY_KIND_LABEL: Record<EntitySearchResult["kind"], string> = {
	monster: "Criatura",
	spell: "Habilidade",
	rune: "Runa",
	item: "Item",
	imbuement: "Imbuement",
};
