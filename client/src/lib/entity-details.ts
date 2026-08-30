const TIBIA_DATA_API = "https://api.tibiadata.com/v4";
const TIBIA_WIKI_API = "https://www.tibiawiki.com.br/api.php";
const TIBIA_WIKI_ORIGIN = "https://www.tibiawiki.com.br";

const getWikiUrl = (title: string) => `https://www.tibiawiki.com.br/wiki/${encodeURIComponent(title.trim().replace(/\s+/g, "_"))}`;

export type WikiPageDetails = {
	title: string;
	html: string;
	wikitext?: string;
	sourceUrl: string;
};

export type WikiEntityKind = "monster" | "spell" | "rune";

export type CreatureSummary = {
	resistances: Array<{
		label: string;
		value: string;
		kind: "immune" | "strong" | "neutral" | "weak" | "healed";
		iconUrl?: string;
	}>;
	loot: string[];
};

export type CreatureFallbackDetails = {
	title: string;
	sourceUrl: string;
	summary: CreatureSummary;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const readContent = (value: unknown) => {
	if (typeof value === "string") {
		return value;
	}

	if (isRecord(value) && typeof value["*"] === "string") {
		return value["*"];
	}

	return undefined;
};

const splitTopLevel = (value: string, separator: string) => {
	const parts: string[] = [];
	let partStart = 0;
	let templateDepth = 0;
	let linkDepth = 0;

	for (let index = 0; index < value.length; index += 1) {
		if (value.startsWith("{{", index)) {
			templateDepth += 1;
			index += 1;
			continue;
		}

		if (value.startsWith("}}", index) && templateDepth > 0) {
			templateDepth -= 1;
			index += 1;
			continue;
		}

		if (value.startsWith("[[", index)) {
			linkDepth += 1;
			index += 1;
			continue;
		}

		if (value.startsWith("]]", index) && linkDepth > 0) {
			linkDepth -= 1;
			index += 1;
			continue;
		}

		if (value[index] === separator && templateDepth === 0 && linkDepth === 0) {
			parts.push(value.slice(partStart, index));
			partStart = index + 1;
		}
	}

	parts.push(value.slice(partStart));
	return parts;
};

const readInfobox = (wikitext: string) => {
	const match = /\{\{\s*Infobox(?:[_ ](?:Creature|Criatura))\b/i.exec(wikitext);
	if (!match) {
		return {};
	}

	const start = match.index;
	let templateDepth = 0;
	let end = wikitext.length;

	for (let index = start; index < wikitext.length - 1; index += 1) {
		if (wikitext.startsWith("{{", index)) {
			templateDepth += 1;
			index += 1;
			continue;
		}

		if (wikitext.startsWith("}}", index) && templateDepth > 0) {
			templateDepth -= 1;
			if (templateDepth === 0) {
				end = index;
				break;
			}
			index += 1;
		}
	}

	const fields: Record<string, string> = {};
	for (const part of splitTopLevel(wikitext.slice(start + 2, end), "|").slice(1)) {
		const equalsIndex = part.indexOf("=");
		if (equalsIndex <= 0) {
			continue;
		}

		const key = part.slice(0, equalsIndex).trim().toLocaleLowerCase();
		const value = part.slice(equalsIndex + 1).trim();
		if (key) {
			fields[key] = value;
		}
	}

	return fields;
};

const cleanWikiValue = (value: string | undefined) => {
	if (!value) {
		return "";
	}

	let cleaned = value
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<br\s*\/?\s*>/gi, ", ")
		.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
		.replace(/\[\[([^\]]+)\]\]/g, "$1")
		.replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1")
		.replace(/<[^>]+>/g, "")
		.replace(/'{2,}/g, "");

	for (let pass = 0; pass < 6; pass += 1) {
		const nextValue = cleaned.replace(/\{\{[^{}]*\}\}/g, "");
		if (nextValue === cleaned) {
			break;
		}
		cleaned = nextValue;
	}

	const decoded = new DOMParser().parseFromString(cleaned, "text/html").body.textContent ?? cleaned;
	return decoded
		.replace(/[\r\n\t]+/g, " ")
		.replace(/\s{2,}/g, " ")
		.trim();
};

const readField = (fields: Record<string, string>, key: string) => cleanWikiValue(fields[key.toLocaleLowerCase()]);

const tibiaWikiFileUrl = (fileName: string) => `${TIBIA_WIKI_ORIGIN}/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;

const creatureElementMetadata = [
	{ label: "Físico", aliases: ["physical", "físico"], iconUrl: tibiaWikiFileUrl("Físico.png") },
	{ label: "Terra", aliases: ["earth", "terra"], iconUrl: tibiaWikiFileUrl("Poisoned Icon.gif") },
	{ label: "Fogo", aliases: ["fire", "fogo"], iconUrl: tibiaWikiFileUrl("Burning Icon.gif") },
	{ label: "Energia", aliases: ["energy", "energia"], iconUrl: tibiaWikiFileUrl("Electrified Icon.gif") },
	{ label: "Gelo", aliases: ["ice", "gelo"], iconUrl: tibiaWikiFileUrl("Freezing Icon.gif") },
	{ label: "Morte", aliases: ["death", "morte"], iconUrl: tibiaWikiFileUrl("Cursed Icon.gif") },
	{ label: "Sagrado", aliases: ["holy", "sagrado"], iconUrl: tibiaWikiFileUrl("Dazzled Icon.gif") },
	{ label: "Água", aliases: ["drown", "drowning", "water", "água"], iconUrl: tibiaWikiFileUrl("Drowning Icon.gif") },
	{ label: "Dreno de vida", aliases: ["life drain", "hp drain", "dreno de vida"], iconUrl: tibiaWikiFileUrl("Life Drain Icone.gif") },
	{ label: "Cura", aliases: ["heal", "healing", "cura"], iconUrl: tibiaWikiFileUrl("Heal Icon.png") },
] as const;

const normalizeCreatureElement = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase()
		.trim();

const findCreatureElement = (value: string) => {
	const normalizedValue = normalizeCreatureElement(value);
	return creatureElementMetadata.find((element) => element.aliases.some((alias) => normalizeCreatureElement(alias) === normalizedValue));
};

const resistanceKind = (value: string): CreatureSummary["resistances"][number]["kind"] => {
	const numericValue = Number.parseFloat(value.replace(",", ".").replace("%", ""));
	if (!Number.isFinite(numericValue)) {
		return "neutral";
	}

	if (numericValue === 0) {
		return "immune";
	}

	if (numericValue < 100) {
		return "strong";
	}

	if (numericValue > 100) {
		return "weak";
	}

	return "neutral";
};

export const extractCreatureSummary = (wikitext?: string): CreatureSummary => {
	if (!wikitext) {
		return { resistances: [], loot: [] };
	}

	const fields = readInfobox(wikitext);
	const resistanceDefinitions: ReadonlyArray<readonly [string, string, string]> = [
		["Físico", "physicalDmgMod", "Físico.png"],
		["Terra", "earthDmgMod", "Poisoned Icon.gif"],
		["Fogo", "fireDmgMod", "Burning Icon.gif"],
		["Energia", "energyDmgMod", "Electrified Icon.gif"],
		["Gelo", "iceDmgMod", "Freezing Icon.gif"],
		["Morte", "deathDmgMod", "Cursed Icon.gif"],
		["Sagrado", "holyDmgMod", "Dazzled Icon.gif"],
		["Água", "drownDmgMod", "Drowning Icon.gif"],
		["Dreno de vida", "hpDrainDmgMod", "Life Drain Icone.gif"],
		["Cura", "healDmgMod", "Heal Icon.png"],
	];
	const resistances: CreatureSummary["resistances"] = resistanceDefinitions
		.map(([label, key, iconFile]) => {
			const value = readField(fields, key);
			return value
				? {
						label,
						value: value.endsWith("%") ? value : `${value}%`,
						kind: resistanceKind(value),
						iconUrl: tibiaWikiFileUrl(iconFile),
					}
				: undefined;
		})
		.filter((resistance): resistance is NonNullable<typeof resistance> => Boolean(resistance));

	const loot = ["lootcomum", "lootincomum", "lootsemiraro", "lootraro", "lootmuitoraro", "lootevent", "lootraid"].flatMap((key) => {
		const value = readField(fields, key);
		return value
			? splitTopLevel(value, ",")
					.map((item) => item.trim())
					.filter(Boolean)
			: [];
	});

	return { resistances, loot };
};

const readCreatureList = (creature: Record<string, unknown>, key: string) => {
	const value = creature[key];
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
};

const createCreatureFallbackSummary = (creature: Record<string, unknown>): CreatureSummary => {
	const resistances = [
		["immune", "immune"],
		["strong", "strong"],
		["weakness", "weak"],
		["healed", "healed"],
	].flatMap(([key, kind]) =>
		readCreatureList(creature, key).map((value) => {
			const element = findCreatureElement(value);
			return {
				label: element?.label ?? value,
				value: "—",
				kind: kind as CreatureSummary["resistances"][number]["kind"],
				iconUrl: element?.iconUrl,
			};
		}),
	);

	return { resistances, loot: readCreatureList(creature, "loot_list") };
};

export const fetchCreatureFallback = async (race: string, signal?: AbortSignal): Promise<CreatureFallbackDetails> => {
	const response = await fetch(`${TIBIA_DATA_API}/creature/${encodeURIComponent(race)}`, { signal });
	if (!response.ok) {
		throw new Error(`TibiaData respondeu HTTP ${response.status}.`);
	}

	const payload: unknown = await response.json();
	const creature = isRecord(payload) && isRecord(payload.creature) ? payload.creature : undefined;
	if (!creature || typeof creature.name !== "string") {
		throw new Error("A TibiaData não retornou uma criatura válida.");
	}

	return {
		title: creature.name,
		sourceUrl: `${TIBIA_DATA_API}/creature/${encodeURIComponent(race)}`,
		summary: createCreatureFallbackSummary(creature),
	};
};

const readApiError = (payload: unknown) => {
	const apiError = isRecord(payload) && isRecord(payload.error) ? payload.error.info : undefined;
	return typeof apiError === "string" ? apiError : undefined;
};

const requestWikiJson = async (params: URLSearchParams, signal?: AbortSignal) => {
	const response = await fetch(`${TIBIA_WIKI_API}?${params.toString()}`, { signal });

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	const payload: unknown = await response.json();
	const apiError = readApiError(payload);
	if (apiError) {
		throw new Error(apiError);
	}

	return payload;
};

const normalizeWikiTitle = (title: string) => title.trim().replace(/\s+/g, " ");

const readQueryPages = (payload: unknown) => {
	if (!isRecord(payload) || !isRecord(payload.query)) {
		return [];
	}

	const pages = payload.query.pages;
	if (Array.isArray(pages)) {
		return pages.filter(isRecord);
	}

	if (isRecord(pages)) {
		return Object.values(pages).filter(isRecord);
	}

	return [];
};

const isCreatureTitle = (title: string) => normalizeWikiTitle(title).toLocaleLowerCase().endsWith(" (criatura)");

const singularizeMonsterWord = (word: string) => {
	const normalizedWord = word.toLocaleLowerCase();
	if (normalizedWord.endsWith("'s") || normalizedWord.length <= 3) {
		return word;
	}
	if (/(ches|shes|xes|zes|ses)$/i.test(word)) {
		return word.slice(0, -2);
	}
	if (normalizedWord.endsWith("ies")) {
		return `${word.slice(0, -3)}y`;
	}
	if (normalizedWord.endsWith("ves")) {
		return `${word.slice(0, -3)}f`;
	}
	if (normalizedWord.endsWith("s") && !normalizedWord.endsWith("ss")) {
		return word.slice(0, -1);
	}
	return word;
};

const singularizeMonsterTitle = (title: string) => normalizeWikiTitle(title).split(" ").map(singularizeMonsterWord).join(" ");

const uniqueTitles = (titles: string[]) => [...new Set(titles.map(normalizeWikiTitle).filter(Boolean))];

const monsterTitleCandidates = (title: string, lookupId?: string) => uniqueTitles([title, singularizeMonsterTitle(title), lookupId ?? ""]);

const directPageCandidates = (title: string, kind: WikiEntityKind, lookupId?: string) => {
	const titles = kind === "monster" ? monsterTitleCandidates(title, lookupId) : [normalizeWikiTitle(title)];
	return uniqueTitles(titles.flatMap((candidate) => [candidate, `${candidate} (Criatura)`]));
};

const findSearchPage = (pages: Record<string, unknown>[], query: string, kind: WikiEntityKind) => {
	const normalizedQuery = normalizeWikiTitle(query).toLocaleLowerCase();
	const exactPage = pages.find(
		(page) =>
			typeof page.title === "string" &&
			(normalizeWikiTitle(page.title).toLocaleLowerCase() === normalizedQuery || isCreatureTitle(page.title)),
	);
	if (exactPage && typeof exactPage.pageid === "number" && typeof exactPage.title === "string") {
		return { pageId: exactPage.pageid, title: exactPage.title };
	}

	if (kind !== "monster") {
		const firstPage = pages.find((page) => typeof page.pageid === "number" && typeof page.title === "string");
		if (firstPage) {
			return { pageId: firstPage.pageid as number, title: firstPage.title as string };
		}
	}

	return undefined;
};

const resolveWikiPage = async (title: string, kind: WikiEntityKind, signal?: AbortSignal, lookupId?: string) => {
	const normalizedTitle = normalizeWikiTitle(title);
	const candidateTitles = directPageCandidates(normalizedTitle, kind, lookupId);
	const queryParams = new URLSearchParams({
		action: "query",
		titles: candidateTitles.join("|"),
		prop: "info",
		redirects: "1",
		format: "json",
		formatversion: "2",
		origin: "*",
	});
	const queryPayload = await requestWikiJson(queryParams, signal);
	const availablePages = readQueryPages(queryPayload).filter(
		(page) => page.missing !== true && typeof page.pageid === "number" && typeof page.title === "string",
	);

	const resolvedPage =
		(kind === "monster" ? availablePages.find((page) => isCreatureTitle(page.title as string)) : undefined) ??
		availablePages.find((page) =>
			directPageCandidates(normalizedTitle, kind, lookupId)
				.map((candidate) => candidate.toLocaleLowerCase())
				.includes(normalizeWikiTitle(page.title as string).toLocaleLowerCase()),
		) ??
		availablePages[0];

	if (resolvedPage) {
		return { pageId: resolvedPage.pageid as number, title: resolvedPage.title as string };
	}

	const searchQueries = kind === "monster" ? monsterTitleCandidates(normalizedTitle, lookupId) : [normalizedTitle];
	for (const searchQuery of searchQueries) {
		const searchParams = new URLSearchParams({
			action: "query",
			list: "search",
			srnamespace: "0",
			srsearch: searchQuery,
			srlimit: "10",
			format: "json",
			formatversion: "2",
			origin: "*",
		});
		const searchPayload = await requestWikiJson(searchParams, signal);
		const search = isRecord(searchPayload) && isRecord(searchPayload.query) ? searchPayload.query.search : undefined;
		const searchResults = Array.isArray(search) ? search.filter(isRecord) : [];
		const searchPage = findSearchPage(searchResults, searchQuery, kind);
		if (searchPage) {
			return searchPage;
		}
	}

	throw new Error("Página não encontrada.");
};

export const fetchWikiDetails = async (
	title: string,
	signal?: AbortSignal,
	kind: WikiEntityKind = "spell",
	lookupId?: string,
): Promise<WikiPageDetails> => {
	const resolvedPage = await resolveWikiPage(title, kind, signal, lookupId);
	const params = new URLSearchParams({
		action: "parse",
		pageid: String(resolvedPage.pageId),
		prop: "text|wikitext",
		redirects: "1",
		format: "json",
		formatversion: "2",
		origin: "*",
	});
	const payload = await requestWikiJson(params, signal);
	const parsed = isRecord(payload) ? payload.parse : undefined;
	if (!isRecord(parsed)) {
		throw new Error(readApiError(payload) ?? "Página não encontrada.");
	}

	const html = readContent(parsed.text);
	if (!html) {
		throw new Error("A página não retornou conteúdo renderizado.");
	}

	const resolvedTitle = typeof parsed.title === "string" ? parsed.title : resolvedPage.title;
	const wikitext = readContent(parsed.wikitext);

	return {
		title: resolvedTitle,
		html,
		wikitext,
		sourceUrl: getWikiUrl(resolvedTitle),
	};
};

export const sanitizeWikiHtml = (html: string) => {
	const document = new DOMParser().parseFromString(html, "text/html");
	document.querySelectorAll("script, iframe, object, embed, form, link, meta, style").forEach((element) => {
		element.remove();
	});

	document.querySelectorAll("*").forEach((element) => {
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();

			if (name.startsWith("on") || name === "style") {
				element.removeAttribute(attribute.name);
				continue;
			}

			if (name !== "href" && name !== "src") {
				continue;
			}

			const value = attribute.value.trim();
			if (value.startsWith("#")) {
				continue;
			}

			try {
				const resolvedUrl = new URL(value, TIBIA_WIKI_ORIGIN);
				if (resolvedUrl.protocol !== "http:" && resolvedUrl.protocol !== "https:") {
					throw new Error("Unsupported URL protocol");
				}

				element.setAttribute(attribute.name, resolvedUrl.href);
			} catch {
				element.removeAttribute(attribute.name);
			}
		}

		if (element.tagName === "A") {
			element.setAttribute("target", "_blank");
			element.setAttribute("rel", "noreferrer");
		}
	});

	return document.body.innerHTML;
};
