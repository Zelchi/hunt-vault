const TIBIA_DATA_API = "https://api.tibiadata.com/v4";
export type EntityKind = "monster" | "spell" | "rune";

export type EntitySearchResult = {
	id: string;
	title: string;
	kind: EntityKind;
	source: "tibiadata";
	lookupId?: string;
	imageUrl?: string;
	snippet?: string;
};

export type EntityCatalog = {
	monsters: CatalogEntity[];
	spells: CatalogEntity[];
	runes: CatalogEntity[];
};

type CatalogEntity = {
	id: string;
	name: string;
	kind: EntityKind;
	imageUrl?: string;
};

const catalogCacheKey = "hunt-vault:entity-catalog:v1";
const catalogCacheMaxAge = 24 * 60 * 60 * 1000;
const emptyCatalog: EntityCatalog = { monsters: [], spells: [], runes: [] };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const fetchJson = async (url: string, signal?: AbortSignal): Promise<unknown> => {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	return response.json();
};

export const normalizeSearchText = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase()
		.trim();

const isEntityKind = (value: unknown): value is EntityKind => value === "monster" || value === "spell" || value === "rune";

const readCachedEntities = (value: unknown, expectedKind?: EntityKind): CatalogEntity[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item): CatalogEntity[] => {
		if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string" || !isEntityKind(item.kind)) {
			return [];
		}
		if (expectedKind && item.kind !== expectedKind) {
			return [];
		}
		return [
			{
				id: item.id,
				name: item.name,
				kind: item.kind,
				imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
			},
		];
	});
};

const readCachedCatalog = () => {
	try {
		const rawValue = localStorage.getItem(catalogCacheKey);
		if (!rawValue) {
			return undefined;
		}

		const parsed: unknown = JSON.parse(rawValue);
		if (!isRecord(parsed) || typeof parsed.savedAt !== "number" || !isRecord(parsed.catalog)) {
			return undefined;
		}

		const catalog: EntityCatalog = {
			monsters: readCachedEntities(parsed.catalog.monsters, "monster"),
			spells: readCachedEntities(parsed.catalog.spells, "spell"),
			runes: readCachedEntities(parsed.catalog.runes, "rune"),
		};
		if (catalog.monsters.length + catalog.spells.length + catalog.runes.length === 0) {
			return undefined;
		}

		return { catalog, savedAt: parsed.savedAt };
	} catch {
		return undefined;
	}
};

const writeCachedCatalog = (catalog: EntityCatalog) => {
	try {
		localStorage.setItem(catalogCacheKey, JSON.stringify({ savedAt: Date.now(), catalog }));
	} catch {
		// O cache é opcional; a busca continua funcionando sem armazenamento local.
	}
};

const readCatalogEntities = (value: unknown, collectionKey: "creature_list" | "spell_list", kind: "monster" | "spell") => {
	if (!isRecord(value)) {
		return [];
	}

	const collection = value[kind === "monster" ? "creatures" : "spells"];
	if (!isRecord(collection) || !Array.isArray(collection[collectionKey])) {
		return [];
	}

	return collection[collectionKey].flatMap((item): CatalogEntity[] => {
		if (!isRecord(item) || typeof item.name !== "string") {
			return [];
		}

		const id = typeof item.race === "string" ? item.race : typeof item.spell_id === "string" ? item.spell_id : item.name;
		const imageUrl = typeof item.image_url === "string" ? item.image_url : undefined;
		const entityKind: EntityKind = kind === "spell" && item.type_rune === true ? "rune" : kind;

		return [{ id, name: item.name, kind: entityKind, imageUrl }];
	});
};

export const loadEntityCatalog = async (): Promise<EntityCatalog> => {
	const cached = readCachedCatalog();
	if (cached && Date.now() - cached.savedAt < catalogCacheMaxAge) {
		return cached.catalog;
	}

	const [creaturesResponse, spellsResponse] = await Promise.allSettled([
		fetchJson(`${TIBIA_DATA_API}/creatures`),
		fetchJson(`${TIBIA_DATA_API}/spells`),
	]);

	const remoteMonsters =
		creaturesResponse.status === "fulfilled" ? readCatalogEntities(creaturesResponse.value, "creature_list", "monster") : [];
	const remoteSpellEntities =
		spellsResponse.status === "fulfilled" ? readCatalogEntities(spellsResponse.value, "spell_list", "spell") : [];
	const remoteSpells = remoteSpellEntities.filter((entity) => entity.kind === "spell");
	const remoteRunes = remoteSpellEntities.filter((entity) => entity.kind === "rune");
	const nextCatalog: EntityCatalog = {
		monsters: remoteMonsters.length > 0 ? remoteMonsters : (cached?.catalog.monsters ?? []),
		spells: remoteSpells.length > 0 ? remoteSpells : (cached?.catalog.spells ?? []),
		runes: remoteRunes.length > 0 ? remoteRunes : (cached?.catalog.runes ?? []),
	};

	if (nextCatalog.monsters.length + nextCatalog.spells.length + nextCatalog.runes.length > 0) {
		writeCachedCatalog(nextCatalog);
		return nextCatalog;
	}

	return emptyCatalog;
};

const catalogResult = (entity: CatalogEntity): EntitySearchResult => ({
	id: `${entity.kind}:${entity.id}`,
	title: entity.name,
	kind: entity.kind,
	source: "tibiadata",
	lookupId: entity.id,
	imageUrl: entity.imageUrl,
	snippet: entity.kind === "monster" ? "Catálogo de criaturas" : entity.kind === "rune" ? "Catálogo de runas" : "Catálogo de habilidades",
});

export const searchCatalog = (catalog: EntityCatalog, query: string) => {
	const normalizedQuery = normalizeSearchText(query);
	if (!normalizedQuery) {
		return [];
	}

	return [...catalog.monsters, ...catalog.spells, ...catalog.runes]
		.filter((entity) => {
			const name = normalizeSearchText(entity.name);
			const id = normalizeSearchText(entity.id);
			return name.includes(normalizedQuery) || id.includes(normalizedQuery);
		})
		.sort((left, right) => {
			const leftName = normalizeSearchText(left.name);
			const rightName = normalizeSearchText(right.name);
			const leftRank = leftName === normalizedQuery ? 0 : leftName.startsWith(normalizedQuery) ? 1 : 2;
			const rightRank = rightName === normalizedQuery ? 0 : rightName.startsWith(normalizedQuery) ? 1 : 2;
			return leftRank - rightRank || leftName.localeCompare(rightName);
		})
		.slice(0, 6)
		.map(catalogResult);
};
