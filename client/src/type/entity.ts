export type WikiEntityKind = "monster" | "spell" | "rune" | "item" | "imbuement";

export type EntityKind = WikiEntityKind | "hunt";

export type EntitySearchResultBase = {
	id: string;
	title: string;
	isBoss?: boolean;
	lookupId?: string;
	imageUrl?: string;
	snippet?: string;
};

export type WikiEntitySearchResult = EntitySearchResultBase & {
	kind: WikiEntityKind;
	source: "tibiawiki";
	externalUrl?: never;
};

export type HuntSearchResult = EntitySearchResultBase & {
	kind: "hunt";
	source: "tibiawatch";
	externalUrl: string;
	huntCode?: string;
};

export type EntitySearchResult = WikiEntitySearchResult | HuntSearchResult;

export type EntitySearchFilter = "boss" | EntitySearchResult["kind"];

export type EntityCatalog = {
	monsters: CatalogEntity[];
	spells: CatalogEntity[];
	runes: CatalogEntity[];
	imbuements: CatalogEntity[];
};

export type CatalogEntity = {
	id: string;
	name: string;
	kind: WikiEntityKind;
	lookupId?: string;
	imageUrl?: string;
};

export type CatalogSearchEntry = {
	entity: CatalogEntity;
	name: string;
	id: string;
};

export type WikiCategoryCacheEntry = {
	fetchedAt: number;
	pages: Record<string, unknown>[];
};

export type SearchCacheEntry = {
	savedAt: number;
	results: EntitySearchResult[];
};
