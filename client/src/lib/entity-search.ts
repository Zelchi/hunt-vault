import Fuse from "fuse.js";

import {
	IMBUEMENT_LEVEL_3_IMAGES,
	TIBIA_WIKI_API,
	TIBIA_WIKI_ORIGIN,
	WIKI_CATALOG_CACHE_KEY,
	WIKI_CATALOG_CACHE_MAX_AGE,
	WIKI_CATALOG_CATEGORIES,
	WIKI_CATALOG_REQUESTS,
	WIKI_SEARCH_CACHE_KEY,
	WIKI_SEARCH_CACHE_MAX_AGE,
} from "@/const/wiki";

export type EntityKind = "monster" | "spell" | "rune" | "item" | "imbuement";

export type EntitySearchResult = {
	id: string;
	title: string;
	kind: EntityKind;
	source: "tibiawiki";
	isBoss?: boolean;
	lookupId?: string;
	imageUrl?: string;
	snippet?: string;
};

export type EntityCatalog = {
	monsters: CatalogEntity[];
	spells: CatalogEntity[];
	runes: CatalogEntity[];
	imbuements: CatalogEntity[];
};

type CatalogEntity = {
	id: string;
	name: string;
	kind: EntityKind;
	lookupId?: string;
	imageUrl?: string;
};

type CatalogSearchEntry = {
	entity: CatalogEntity;
	name: string;
	id: string;
};

const emptyCatalog: EntityCatalog = { monsters: [], spells: [], runes: [], imbuements: [] };
let catalogSearchIndex: { catalog: EntityCatalog; fuse: Fuse<CatalogSearchEntry> } | undefined;
const wikiCategoryCache = new Map<string, { fetchedAt: number; pages: Record<string, unknown>[] }>();
type SearchCacheEntry = { savedAt: number; results: EntitySearchResult[] };
let wikiSearchCache: Record<string, SearchCacheEntry> | undefined;

const getWikiImageUrl = (title: string) => {
	const fileTitle = title.trim().replace(/\s+/g, "_");
	return `${TIBIA_WIKI_ORIGIN}/wiki/Special:FilePath/${encodeURIComponent(`${fileTitle}.gif`)}`;
};

const getImbuementImageUrl = (title: string) => {
	const imbuementName = normalizeSearchText(title).replace(/\s+\([^)]*\)$/i, "");
	const fileName = IMBUEMENT_LEVEL_3_IMAGES[imbuementName];
	return fileName ? `${TIBIA_WIKI_ORIGIN}/wiki/Special:FilePath/${encodeURIComponent(fileName)}` : getWikiImageUrl(title);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const fetchJson = async (url: string, signal?: AbortSignal): Promise<unknown> => {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	return response.json();
};

export const normalizeSearchText = (value: string) => {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase()
		.trim();
};

const isRuneTitle = (title: string) => {
	const normalizedTitle = normalizeSearchText(title).replace(/\s+\([^)]*\)\s*$/, "");
	return /(?:^|\s)(?:rune|runa)$/.test(normalizedTitle);
};

const isEntityKind = (value: unknown): value is EntityKind => {
	return value === "monster" || value === "spell" || value === "rune" || value === "item" || value === "imbuement";
};

const isCachedSearchResult = (value: unknown): value is EntitySearchResult => {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.title === "string" &&
		isEntityKind(value.kind) &&
		value.source === "tibiawiki"
	);
};

const getWikiPageId = (result: EntitySearchResult) => {
	const wikiIdMatch = result.id.match(/(?:^|:)wiki:(\d+)$/);
	if (wikiIdMatch) {
		return wikiIdMatch[1];
	}

	const directIdMatch = result.id.match(/^(?:item|rune|spell|monster|imbuement):(\d+)$/);
	return directIdMatch?.[1];
};

const normalizeSearchResult = (result: EntitySearchResult): EntitySearchResult => {
	const isMisclassifiedRune = result.kind === "rune" && !isRuneTitle(result.title);
	const kind = isMisclassifiedRune ? "item" : result.kind;
	const pageId = getWikiPageId(result);
	const imageUrl = kind === "imbuement" ? getImbuementImageUrl(result.title) : getWikiImageUrl(result.title);

	return {
		...result,
		id: isMisclassifiedRune && pageId ? `item:${pageId}` : result.id,
		kind,
		imageUrl,
		snippet: isMisclassifiedRune ? "Item" : result.snippet,
	};
};

const getSearchResultKey = (result: EntitySearchResult) => {
	const pageId = getWikiPageId(result);
	return pageId ? `wiki:${pageId}` : `${result.kind}:${normalizeSearchText(result.title)}`;
};

const getSearchResultPriority = (result: EntitySearchResult) => {
	if (result.kind === "imbuement") {
		return 0;
	}
	if (result.kind === "rune") {
		return 1;
	}
	if (result.kind === "spell") {
		return 2;
	}
	if (result.kind === "monster" && result.isBoss) {
		return 3;
	}
	if (result.kind === "monster") {
		return 4;
	}
	return 5;
};

export const mergeSearchResults = (currentResults: EntitySearchResult[], nextResults: EntitySearchResult[]) => {
	const uniqueResults = new Map<string, EntitySearchResult>();
	for (const rawResult of [...currentResults, ...nextResults]) {
		const result = normalizeSearchResult(rawResult);
		const key = getSearchResultKey(result);
		const existingResult = uniqueResults.get(key);
		if (!existingResult || getSearchResultPriority(result) < getSearchResultPriority(existingResult)) {
			uniqueResults.set(key, result);
		} else if (result.isBoss && !existingResult.isBoss) {
			uniqueResults.set(key, { ...existingResult, isBoss: true, snippet: "Boss" });
		}
	}

	return [...uniqueResults.values()];
};

const readWikiSearchCache = () => {
	if (wikiSearchCache) {
		return wikiSearchCache;
	}

	wikiSearchCache = {};
	try {
		const rawValue = localStorage.getItem(WIKI_SEARCH_CACHE_KEY);
		if (!rawValue) {
			return wikiSearchCache;
		}

		const parsed: unknown = JSON.parse(rawValue);
		if (!isRecord(parsed)) {
			return wikiSearchCache;
		}

		const now = Date.now();
		for (const [query, entry] of Object.entries(parsed)) {
			if (!isRecord(entry) || typeof entry.savedAt !== "number" || !Array.isArray(entry.results)) {
				continue;
			}
			if (now - entry.savedAt >= WIKI_SEARCH_CACHE_MAX_AGE) {
				continue;
			}

			const results = entry.results.filter(isCachedSearchResult);
			if (results.length > 0) {
				wikiSearchCache[query] = { savedAt: entry.savedAt, results };
			}
		}
	} catch {
		wikiSearchCache = {};
	}

	return wikiSearchCache;
};

const writeWikiSearchCache = () => {
	localStorage.setItem(WIKI_SEARCH_CACHE_KEY, JSON.stringify(readWikiSearchCache()));
};

const rankCachedResults = (query: string, results: EntitySearchResult[]) => {
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2 || results.length === 0) {
		return [];
	}

	const fuse = new Fuse(
		results.map((result) => {
			return {
				result,
				title: normalizeSearchText(result.title),
				snippet: normalizeSearchText(result.snippet ?? ""),
			};
		}),
		{
			keys: [
				{ name: "title", weight: 0.9 },
				{ name: "snippet", weight: 0.1 },
			],
			ignoreLocation: true,
			minMatchCharLength: 2,
			threshold: 0.42,
		},
	);

	return fuse.search(normalizedQuery, { limit: 50 }).map(({ item }) => {
		return item.result;
	});
};

export const getCachedSearchResults = (query: string) => {
	const cache = readWikiSearchCache();
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2) {
		return [];
	}

	const allResults = Object.values(cache).flatMap((entry) => {
		return entry.results;
	});
	return rankCachedResults(query, mergeSearchResults(cache[normalizedQuery]?.results ?? [], allResults));
};

export const cacheSearchResults = (query: string, results: EntitySearchResult[]) => {
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2 || results.length === 0) {
		return;
	}

	const cache = readWikiSearchCache();
	cache[normalizedQuery] = {
		savedAt: Date.now(),
		results: mergeSearchResults(cache[normalizedQuery]?.results ?? [], results),
	};
	writeWikiSearchCache();
};

const readCachedEntities = (value: unknown, expectedKind: EntityKind): CatalogEntity[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item): CatalogEntity[] => {
		if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string" || !isEntityKind(item.kind)) {
			return [];
		}
		if (item.kind !== expectedKind) {
			return [];
		}
		if (expectedKind === "rune" && !isRuneTitle(item.name)) {
			return [];
		}

		return [
			{
				id: item.id,
				name: item.name,
				kind: item.kind,
				lookupId: typeof item.lookupId === "string" ? item.lookupId : item.name,
				imageUrl: expectedKind === "imbuement" ? getImbuementImageUrl(item.name) : getWikiImageUrl(item.name),
			},
		];
	});
};

const readCachedCatalog = () => {
	try {
		const rawValue = localStorage.getItem(WIKI_CATALOG_CACHE_KEY);
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
			imbuements: readCachedEntities(parsed.catalog.imbuements, "imbuement"),
		};
		if (
			Object.values(catalog).every((entities) => {
				return entities.length === 0;
			})
		) {
			return undefined;
		}

		return { catalog, savedAt: parsed.savedAt };
	} catch {
		return undefined;
	}
};

const writeCachedCatalog = (catalog: EntityCatalog) => {
	localStorage.setItem(WIKI_CATALOG_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), catalog }));
};

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

const readWikiSearchPages = (value: unknown) => {
	if (!isRecord(value) || !isRecord(value.query) || !Array.isArray(value.query.search)) {
		return [];
	}

	return value.query.search.filter((page): page is Record<string, unknown> => {
		return isRecord(page) && typeof page.title === "string" && (typeof page.pageid === "number" || typeof page.pageid === "undefined");
	});
};

const readWikiItemPages = (value: unknown) => {
	if (!isRecord(value) || !isRecord(value.query) || !Array.isArray(value.query.pages)) {
		return [];
	}

	return value.query.pages.filter((page): page is Record<string, unknown> => {
		return isRecord(page) && typeof page.title === "string" && Array.isArray(page.categories);
	});
};

const readWikiCreaturePages = (value: unknown) => {
	if (!isRecord(value) || !isRecord(value.query) || !Array.isArray(value.query.pages)) {
		return [];
	}

	return value.query.pages.filter((page): page is Record<string, unknown> => {
		return isRecord(page) && typeof page.title === "string" && typeof page.pageid === "number" && Array.isArray(page.revisions);
	});
};

const readWikiCategoryMembers = (value: unknown) => {
	if (!isRecord(value) || !isRecord(value.query) || !Array.isArray(value.query.categorymembers)) {
		return [];
	}

	return value.query.categorymembers.filter((member): member is Record<string, unknown> => {
		return isRecord(member) && typeof member.title === "string" && typeof member.pageid === "number";
	});
};

const readWikiCategoryContinuation = (value: unknown) => {
	if (!isRecord(value) || !isRecord(value.continue) || typeof value.continue.cmcontinue !== "string") {
		return undefined;
	}

	return value.continue.cmcontinue;
};

const loadWikiCategoryMembers = async (categoryTitle: string, signal?: AbortSignal, forceRefresh = false) => {
	const cached = wikiCategoryCache.get(categoryTitle);
	if (!forceRefresh && cached && Date.now() - cached.fetchedAt < WIKI_CATALOG_CACHE_MAX_AGE) {
		return cached.pages;
	}

	const pages: Record<string, unknown>[] = [];
	let continuation: string | undefined;
	const requestedContinuations = new Set<string>();

	do {
		const params = new URLSearchParams({
			action: "query",
			list: "categorymembers",
			cmtitle: categoryTitle,
			cmnamespace: "0",
			cmlimit: "500",
			format: "json",
			formatversion: "2",
			origin: "*",
		});
		if (continuation) {
			params.set("cmcontinue", continuation);
		}

		const payload = await fetchJson(`${TIBIA_WIKI_API}?${params.toString()}`, signal);
		pages.push(...readWikiCategoryMembers(payload));
		const nextContinuation = readWikiCategoryContinuation(payload);
		if (!nextContinuation || requestedContinuations.has(nextContinuation)) {
			continuation = undefined;
		} else {
			requestedContinuations.add(nextContinuation);
			continuation = nextContinuation;
		}
	} while (continuation);

	wikiCategoryCache.set(categoryTitle, { fetchedAt: Date.now(), pages });
	return pages;
};

const createCatalogEntities = (pages: Record<string, unknown>[], kind: EntityKind): CatalogEntity[] => {
	const seenTitles = new Set<string>();

	return pages.flatMap((page): CatalogEntity[] => {
		const title = page.title as string;
		const normalizedTitle = normalizeSearchText(title);
		if (kind === "rune" && !isRuneTitle(title)) {
			return [];
		}
		if (seenTitles.has(normalizedTitle)) {
			return [];
		}
		seenTitles.add(normalizedTitle);

		return [
			{
				id: `${kind}:wiki:${page.pageid}`,
				name: title,
				kind,
				lookupId: title,
				imageUrl: kind === "imbuement" ? getImbuementImageUrl(title) : getWikiImageUrl(title),
			},
		];
	});
};

export const loadEntityCatalog = async (): Promise<EntityCatalog> => {
	const cached = readCachedCatalog();
	if (cached && Date.now() - cached.savedAt < WIKI_CATALOG_CACHE_MAX_AGE) {
		return cached.catalog;
	}

	const categoryResponses = await Promise.allSettled(
		WIKI_CATALOG_REQUESTS.map(({ title }) => {
			return loadWikiCategoryMembers(title);
		}),
	);
	const nextCatalog: EntityCatalog = { ...emptyCatalog };

	WIKI_CATALOG_REQUESTS.forEach(({ key, kind }, index) => {
		const response = categoryResponses[index];
		if (response?.status === "fulfilled") {
			nextCatalog[key] = createCatalogEntities(response.value, kind);
		}
	});

	if (
		Object.values(nextCatalog).some((entities) => {
			return entities.length > 0;
		})
	) {
		writeCachedCatalog(nextCatalog);
		return nextCatalog;
	}

	return cached?.catalog ?? emptyCatalog;
};

const catalogResult = (entity: CatalogEntity): EntitySearchResult => {
	return {
		id: entity.id,
		title: entity.name,
		kind: entity.kind,
		source: "tibiawiki",
		lookupId: entity.lookupId ?? entity.name,
		imageUrl: entity.imageUrl,
		snippet:
			entity.kind === "monster"
				? "Criatura"
				: entity.kind === "rune"
					? "Runa"
					: entity.kind === "imbuement"
						? "Imbuement"
						: "Habilidade",
	};
};

const getCatalogSearchFuse = (catalog: EntityCatalog) => {
	if (catalogSearchIndex?.catalog === catalog) {
		return catalogSearchIndex.fuse;
	}

	const entries: CatalogSearchEntry[] = [...catalog.monsters, ...catalog.spells, ...catalog.runes, ...catalog.imbuements].map(
		(entity) => {
			return {
				entity,
				name: normalizeSearchText(entity.name),
				id: normalizeSearchText(entity.id),
			};
		},
	);
	const fuse = new Fuse(entries, {
		keys: [
			{ name: "name", weight: 0.9 },
			{ name: "id", weight: 0.1 },
		],
		ignoreLocation: true,
		minMatchCharLength: 2,
		threshold: 0.42,
	});

	catalogSearchIndex = { catalog, fuse };
	return fuse;
};

const readWikiRevisionContent = (page: Record<string, unknown>) => {
	if (!Array.isArray(page.revisions)) {
		return "";
	}

	const revision = page.revisions[0];
	if (!isRecord(revision) || !isRecord(revision.slots) || !isRecord(revision.slots.main)) {
		return "";
	}

	return typeof revision.slots.main.content === "string" ? revision.slots.main.content : "";
};

const hasWikiCategory = (page: Record<string, unknown>, prefixes: string[]) => {
	return (
		Array.isArray(page.categories) &&
		(page.categories as unknown[]).some((category) => {
			return (
				isRecord(category) &&
				typeof category.title === "string" &&
				prefixes.some((prefix) => {
					return normalizeSearchText(category.title as string).startsWith(prefix);
				})
			);
		})
	);
};

const isItemPage = (page: Record<string, unknown>) => {
	return (page.categories as unknown[]).some((category) => {
		return (
			isRecord(category) && typeof category.title === "string" && normalizeSearchText(category.title).startsWith("categoria:itens")
		);
	});
};

const isCreaturePage = (page: Record<string, unknown>) => {
	return /\{\{\s*Infobox(?:[_ ](?:Creature|Criatura))\b/i.test(readWikiRevisionContent(page));
};

const isRunePage = (page: Record<string, unknown>) => {
	const title = typeof page.title === "string" ? page.title : "";
	const content = readWikiRevisionContent(page);
	return (
		/\{\{\s*Infobox(?:[_ ](?:Rune|Runa))\b/i.test(content) ||
		isRuneTitle(title) ||
		(hasWikiCategory(page, ["categoria:runas"]) && !isItemPage(page))
	);
};

const isSpellPage = (page: Record<string, unknown>) => {
	return (
		hasWikiCategory(page, ["categoria:magias", "categoria:spells", "categoria:habilidades"]) ||
		/\{\{\s*Infobox(?:[_ ](?:Spell|Magia|Habilidade))\b/i.test(readWikiRevisionContent(page))
	);
};

const isBossPage = (page: Record<string, unknown>) => {
	return (
		(Array.isArray(page.categories) &&
			(page.categories as unknown[]).some((category) => {
				return (
					isRecord(category) &&
					typeof category.title === "string" &&
					(normalizeSearchText(category.title) === "categoria:bosses" ||
						normalizeSearchText(category.title).startsWith("categoria:bosses "))
				);
			})) ||
		/\|\s*isboss\s*=\s*(?:sim|yes|true)\b/i.test(readWikiRevisionContent(page))
	);
};

export const searchWikiItems = async (query: string, signal?: AbortSignal): Promise<EntitySearchResult[]> => {
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2) {
		return [];
	}

	const params = new URLSearchParams({
		action: "query",
		list: "search",
		srnamespace: "0",
		srsearch: query.trim(),
		srlimit: "10",
		srprop: "snippet",
		format: "json",
		formatversion: "2",
		origin: "*",
	});
	const searchPayload = await fetchJson(`${TIBIA_WIKI_API}?${params.toString()}`, signal);
	const searchPages = readWikiSearchPages(searchPayload).filter((page) => {
		return typeof page.pageid === "number";
	});
	if (searchPages.length === 0) {
		return [];
	}

	const pageIDs = searchPages
		.map((page) => {
			return String(page.pageid);
		})
		.join("|");
	const categoryParams = new URLSearchParams({
		action: "query",
		pageids: pageIDs,
		prop: "categories",
		redirects: "1",
		cllimit: "50",
		format: "json",
		formatversion: "2",
		origin: "*",
	});
	const categoryPayload = await fetchJson(`${TIBIA_WIKI_API}?${categoryParams.toString()}`, signal);
	const seenTitles = new Set<string>();

	return readWikiItemPages(categoryPayload)
		.filter(isItemPage)
		.flatMap((page): EntitySearchResult[] => {
			const title = page.title as string;
			const normalizedTitle = normalizeSearchText(title);
			if (seenTitles.has(normalizedTitle)) {
				return [];
			}
			seenTitles.add(normalizedTitle);
			return [
				{
					id: `item:${typeof page.pageid === "number" ? page.pageid : title}`,
					title,
					kind: "item",
					source: "tibiawiki",
					lookupId: title,
					imageUrl: getWikiImageUrl(title),
					snippet: "Item",
				},
			];
		})
		.sort((left, right) => {
			const rankDifference =
				getMatchRank(normalizeSearchText(left.title), normalizedQuery) -
				getMatchRank(normalizeSearchText(right.title), normalizedQuery);
			return rankDifference || left.title.localeCompare(right.title);
		});
};

export const searchWikiCreatures = async (query: string, signal?: AbortSignal): Promise<EntitySearchResult[]> => {
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2) {
		return [];
	}

	const params = new URLSearchParams({
		action: "query",
		list: "search",
		srnamespace: "0",
		srsearch: query.trim(),
		srlimit: "20",
		srprop: "snippet",
		format: "json",
		formatversion: "2",
		origin: "*",
	});
	const searchPayload = await fetchJson(`${TIBIA_WIKI_API}?${params.toString()}`, signal);
	const searchPages = readWikiSearchPages(searchPayload).filter((page) => {
		return typeof page.pageid === "number";
	});
	if (searchPages.length === 0) {
		return [];
	}

	const pageIDs = searchPages
		.map((page) => {
			return String(page.pageid);
		})
		.join("|");
	const detailsParams = new URLSearchParams({
		action: "query",
		pageids: pageIDs,
		prop: "revisions|categories",
		redirects: "1",
		rvprop: "content",
		rvslots: "main",
		cllimit: "100",
		format: "json",
		formatversion: "2",
		origin: "*",
	});
	const detailsPayload = await fetchJson(`${TIBIA_WIKI_API}?${detailsParams.toString()}`, signal);
	const seenTitles = new Set<string>();

	return readWikiCreaturePages(detailsPayload)
		.filter(isCreaturePage)
		.flatMap((page): EntitySearchResult[] => {
			const title = page.title as string;
			const normalizedTitle = normalizeSearchText(title);
			if (seenTitles.has(normalizedTitle)) {
				return [];
			}
			seenTitles.add(normalizedTitle);
			return [
				{
					id: `monster:wiki:${page.pageid}`,
					title,
					kind: "monster",
					source: "tibiawiki",
					isBoss: isBossPage(page),
					imageUrl: getWikiImageUrl(title),
					snippet: isBossPage(page) ? "Boss" : "Criatura",
				},
			];
		})
		.sort((left, right) => {
			const rankDifference =
				getMatchRank(normalizeSearchText(left.title), normalizedQuery) -
				getMatchRank(normalizeSearchText(right.title), normalizedQuery);
			return rankDifference || left.title.localeCompare(right.title);
		});
};

const searchWikiSpellPages = async (query: string, kind: "spell" | "rune", signal?: AbortSignal): Promise<EntitySearchResult[]> => {
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2) {
		return [];
	}

	const params = new URLSearchParams({
		action: "query",
		list: "search",
		srnamespace: "0",
		srsearch: query.trim(),
		srlimit: "20",
		srprop: "snippet",
		format: "json",
		formatversion: "2",
		origin: "*",
	});
	const searchPayload = await fetchJson(`${TIBIA_WIKI_API}?${params.toString()}`, signal);
	const searchPages = readWikiSearchPages(searchPayload).filter((page) => {
		return typeof page.pageid === "number";
	});
	if (searchPages.length === 0) {
		return [];
	}

	const pageIDs = searchPages
		.map((page) => {
			return String(page.pageid);
		})
		.join("|");
	const detailsParams = new URLSearchParams({
		action: "query",
		pageids: pageIDs,
		prop: "revisions|categories",
		redirects: "1",
		rvprop: "content",
		rvslots: "main",
		cllimit: "100",
		format: "json",
		formatversion: "2",
		origin: "*",
	});
	const detailsPayload = await fetchJson(`${TIBIA_WIKI_API}?${detailsParams.toString()}`, signal);
	const seenTitles = new Set<string>();

	return readWikiCreaturePages(detailsPayload)
		.filter((page) => {
			return kind === "rune" ? isRunePage(page) : isSpellPage(page) && !isRunePage(page);
		})
		.flatMap((page): EntitySearchResult[] => {
			const title = page.title as string;
			const normalizedTitle = normalizeSearchText(title);
			if (seenTitles.has(normalizedTitle)) {
				return [];
			}
			seenTitles.add(normalizedTitle);
			return [
				{
					id: `${kind}:wiki:${page.pageid}`,
					title,
					kind,
					source: "tibiawiki",
					lookupId: title,
					imageUrl: getWikiImageUrl(title),
					snippet: "Rune",
				},
			];
		})
		.sort((left, right) => {
			const rankDifference =
				getMatchRank(normalizeSearchText(left.title), normalizedQuery) -
				getMatchRank(normalizeSearchText(right.title), normalizedQuery);
			return rankDifference || left.title.localeCompare(right.title);
		});
};

export const searchWikiSpells = (query: string, signal?: AbortSignal) => {
	return searchWikiSpellPages(query, "spell", signal);
};

export const searchWikiRunes = (query: string, signal?: AbortSignal) => {
	return searchWikiSpellPages(query, "rune", signal);
};

export const searchWikiImbuements = async (query: string, signal?: AbortSignal): Promise<EntitySearchResult[]> => {
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2) {
		return [];
	}

	const pages = await loadWikiCategoryMembers(WIKI_CATALOG_CATEGORIES.imbuements.title, signal, true);
	const showAllImbuements = ["imbuement", "imbuements", "encantamento", "encantamentos"].includes(normalizedQuery);
	const matchingPages = showAllImbuements
		? [...pages].sort((left, right) => {
				return (left.title as string).localeCompare(right.title as string);
			})
		: new Fuse(
				pages.map((page) => {
					return {
						page,
						title: normalizeSearchText(page.title as string),
					};
				}),
				{
					keys: ["title"],
					ignoreLocation: true,
					minMatchCharLength: 2,
					threshold: 0.42,
				},
			)
				.search(normalizedQuery, { limit: 30 })
				.map(({ item }) => {
					return item.page;
				});

	return matchingPages.map((page): EntitySearchResult => {
		const title = page.title as string;
		return {
			id: `imbuement:wiki:${page.pageid}`,
			title,
			kind: "imbuement",
			source: "tibiawiki",
			lookupId: title,
			imageUrl: getImbuementImageUrl(title),
			snippet: "Imbuement",
		};
	});
};

export const searchCatalog = (catalog: EntityCatalog, query: string) => {
	const normalizedQuery = normalizeSearchText(query);
	if (normalizedQuery.length < 2) {
		return [];
	}

	return getCatalogSearchFuse(catalog)
		.search(normalizedQuery, { limit: 50 })
		.map(({ item }) => {
			return item.entity;
		})
		.map(catalogResult);
};
