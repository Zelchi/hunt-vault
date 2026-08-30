const TIBIA_DATA_API = "https://api.tibiadata.com/v4";
const TIBIA_LIBRARY_IMAGES = "https://static.tibia.com/images/library";
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
	formula?: string;
	imageUrl?: string;
};

const catalogCacheKey = "hunt-vault:entity-catalog:v4";
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
				formula: typeof item.formula === "string" ? item.formula : undefined,
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
	localStorage.setItem(catalogCacheKey, JSON.stringify({ savedAt: Date.now(), catalog }));
};

const getSpellImageUrl = (spellId: string) => `${TIBIA_LIBRARY_IMAGES}/${encodeURIComponent(spellId)}.png`;

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
		const formula = typeof item.formula === "string" ? item.formula : undefined;
		const imageUrl = typeof item.image_url === "string" ? item.image_url : kind === "spell" ? getSpellImageUrl(id) : undefined;
		const entityKind: EntityKind = kind === "spell" && item.type_rune === true ? "rune" : kind;

		return [{ id, name: item.name, kind: entityKind, formula, imageUrl }];
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
	snippet:
		entity.kind === "monster"
			? "Catálogo de criaturas"
			: entity.kind === "rune"
				? "Catálogo de runas"
				: entity.formula
					? `Conjuração: ${entity.formula}`
					: "Catálogo de habilidades",
});

const getMatchRank = (value: string, query: string) => {
	if (value === query) {
		return 0;
	}
	if (value.startsWith(query)) {
		return 1;
	}
	if (value.includes(query)) {
		return 2;
	}
	return 3;
};

export const searchCatalog = (catalog: EntityCatalog, query: string) => {
	const normalizedQuery = normalizeSearchText(query);
	if (!normalizedQuery) {
		return [];
	}

	return [...catalog.monsters, ...catalog.spells, ...catalog.runes]
		.filter((entity) => {
			const name = normalizeSearchText(entity.name);
			const formula = entity.kind === "spell" ? normalizeSearchText(entity.formula ?? "") : "";
			const id = normalizeSearchText(entity.id);
			return name.includes(normalizedQuery) || formula.includes(normalizedQuery) || id.includes(normalizedQuery);
		})
		.sort((left, right) => {
			const leftName = normalizeSearchText(left.name);
			const rightName = normalizeSearchText(right.name);
			const leftFormula = left.kind === "spell" ? normalizeSearchText(left.formula ?? "") : "";
			const rightFormula = right.kind === "spell" ? normalizeSearchText(right.formula ?? "") : "";
			const leftId = normalizeSearchText(left.id);
			const rightId = normalizeSearchText(right.id);
			const leftRank = getMatchRank(leftName, normalizedQuery);
			const rightRank = getMatchRank(rightName, normalizedQuery);

			if (leftRank !== 3 || rightRank !== 3) {
				return leftRank - rightRank;
			}

			const leftFormulaRank = getMatchRank(leftFormula, normalizedQuery);
			const rightFormulaRank = getMatchRank(rightFormula, normalizedQuery);
			if (leftFormulaRank !== 3 || rightFormulaRank !== 3) {
				return leftFormulaRank - rightFormulaRank;
			}

			const leftIdRank = getMatchRank(leftId, normalizedQuery);
			const rightIdRank = getMatchRank(rightId, normalizedQuery);
			return leftIdRank - rightIdRank || leftName.localeCompare(rightName);
		})
		.map(catalogResult);
};
