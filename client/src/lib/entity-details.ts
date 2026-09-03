import { TIBIA_WIKI_API, TIBIA_WIKI_ORIGIN } from "@/const/wiki";
import type { WikiEntityKind } from "@/type/entity";
import type { CreatureSummary, ImbuementSummary, ItemSummary, WikiPageDetails } from "@/type/entity-details";

const getWikiUrl = (title: string) => {
	return `${TIBIA_WIKI_ORIGIN}/wiki/${encodeURIComponent(title.trim().replace(/\s+/g, "_"))}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

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
	const match = /\{\{\s*Infobox(?:[_ ](?:Creature|Criatura|Item|Imbuement|Rune|Runas|Spell|Magia|Habilidade|Book|Livro))?\b/i.exec(
		wikitext,
	);
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

const readField = (fields: Record<string, string>, key: string) => {
	return cleanWikiValue(fields[key.toLocaleLowerCase()]);
};

const tibiaWikiFileUrl = (fileName: string) => {
	return `${TIBIA_WIKI_ORIGIN}/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
};

const normalizeCreatureElement = (value: string) => {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase()
		.trim();
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
		.filter((resistance): resistance is NonNullable<typeof resistance> => {
			return Boolean(resistance);
		});

	const loot = ["lootcomum", "lootincomum", "lootsemiraro", "lootraro", "lootmuitoraro", "lootevent", "lootraid"].flatMap((key) => {
		const value = readField(fields, key);
		return value
			? splitTopLevel(value, ",")
					.map((item) => {
						return item.trim();
					})
					.filter(Boolean)
			: [];
	});

	return { resistances, loot };
};

const firstItemField = (fields: Record<string, string>, keys: string[]) => {
	for (const key of keys) {
		const value = readField(fields, key);
		if (value) {
			return value;
		}
	}

	return "";
};

const readItemList = (fields: Record<string, string>, key: string) => {
	const value = fields[key.toLocaleLowerCase()];
	if (!value) {
		return [];
	}

	return splitTopLevel(value, ",")
		.map((item) => {
			return cleanWikiValue(item)
				.replace(/[.;]+$/, "")
				.trim();
		})
		.filter(Boolean);
};

const compactItemList = (items: string[], limit: number) => {
	if (items.length <= limit) {
		return items.join(", ");
	}

	return `${items.slice(0, limit).join(", ")} + ${items.length - limit} outros`;
};

const shortenItemText = (value: string, limit = 240) => {
	return value.length > limit ? `${value.slice(0, limit).trimEnd()}…` : value;
};

export const extractItemSummary = (wikitext?: string): ItemSummary | undefined => {
	if (!wikitext) {
		return undefined;
	}

	const fields = readInfobox(wikitext);
	const itemAttributeDefinitions: ReadonlyArray<readonly [string, string[]]> = [
		["Categoria", ["itemclass"]],
		["Tipo", ["primarytype"]],
		["Autor", ["author"]],
		["Localização", ["location"]],
		["Peso", ["weight"]],
		["Vocação", ["vocrequired"]],
		["Level mínimo", ["levelrequired"]],
		["Armadura", ["armor"]],
		["Ataque", ["attack"]],
		["Defesa", ["defense", "defence"]],
		["Bônus", ["skillboost"]],
		["Stackável", ["stackable"]],
		["Valor", ["npcvalue", "npcprice", "value"]],
		["Imbuement", ["imbuement"]],
		["Classificação", ["classificacao", "classification"]],
		["Max tier", ["max_tier", "maxtier"]],
		["Traduzido", ["traduzido"]],
		["Implementado", ["implemented"]],
		["Código TIBN", ["tibn1", "tibn"]],
	];
	const attributes = itemAttributeDefinitions
		.map(([label, keys]) => {
			const rawValue = firstItemField(fields, keys);
			if (!rawValue) {
				return undefined;
			}

			const value = label === "Peso" && !/\boz\b/i.test(rawValue) ? `${rawValue} oz` : rawValue;
			return {
				label,
				value: label === "Stackável" ? (normalizeCreatureElement(value) === "sim" ? "Sim" : "Não") : value,
			};
		})
		.filter((attribute): attribute is ItemSummary["attributes"][number] => {
			return Boolean(attribute);
		});

	const description = shortenItemText(firstItemField(fields, ["attrib", "notes", "blurb", "flavortext"]));
	const sourceDefinitions: ReadonlyArray<readonly [string, string, number]> = [
		["Drop", "droppedby", 6],
		["Raid", "droppedRaidby", 4],
		["Compra", "buyfrom", 4],
		["Venda", "sellto", 4],
	];
	const sources = sourceDefinitions
		.map(([label, key, limit]) => {
			const value = compactItemList(readItemList(fields, key), limit);
			return value ? { label, value } : undefined;
		})
		.filter((source): source is ItemSummary["sources"][number] => {
			return Boolean(source);
		});

	if (attributes.length === 0 && !description && sources.length === 0) {
		return undefined;
	}

	return {
		attributes,
		description: description || undefined,
		sources,
	};
};

export const extractImbuementSummary = (wikitext?: string): ImbuementSummary | undefined => {
	if (!wikitext) {
		return undefined;
	}

	const fields = readInfobox(wikitext);
	const attributeDefinitions: ReadonlyArray<readonly [string, string[]]> = [
		["Categoria", ["modificador"]],
		["Classe", ["imbuementclass"]],
		["Aplicável em", ["aplicavel"]],
		["Duração", ["duração", "duracao"]],
	];
	const attributes = attributeDefinitions
		.map(([label, keys]) => {
			const value = firstItemField(fields, keys);
			return value ? { label, value: shortenItemText(value) } : undefined;
		})
		.filter((attribute): attribute is ImbuementSummary["attributes"][number] => {
			return Boolean(attribute);
		});

	const effectDefinitions: ReadonlyArray<readonly [string, string]> = [
		["Basic", "efeitoBasic"],
		["Intricate", "efeitoIntricate"],
		["Powerful", "efeitoPowerful"],
	];
	const effects = effectDefinitions
		.map(([label, key]) => {
			const value = firstItemField(fields, [key]);
			return value ? { label, value: shortenItemText(value) } : undefined;
		})
		.filter((effect): effect is ImbuementSummary["effects"][number] => {
			return Boolean(effect);
		});

	const materialDefinitions: ReadonlyArray<readonly [string, string, string]> = [
		["Basic", "qtdItemBasic", "itemBasic"],
		["Intricate", "qtdItemIntricate", "itemIntricate"],
		["Powerful", "qtdItemPowerful", "itemPowerful"],
	];
	const materials = materialDefinitions
		.map(([label, quantityKey, itemKey]) => {
			const quantity = firstItemField(fields, [quantityKey]);
			const item = firstItemField(fields, [itemKey]);
			const value = [quantity, item].filter(Boolean).join(" × ");
			return value
				? {
						label,
						value: shortenItemText(value),
						imageUrl: item ? tibiaWikiFileUrl(`${item}.gif`) : undefined,
					}
				: undefined;
		})
		.filter((material): material is ImbuementSummary["materials"][number] => {
			return Boolean(material);
		});

	if (attributes.length === 0 && effects.length === 0 && materials.length === 0) {
		return undefined;
	}

	return { attributes, effects, materials };
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

const normalizeWikiTitle = (title: string) => {
	return title.trim().replace(/\s+/g, " ");
};

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

const isCreatureTitle = (title: string) => {
	return normalizeWikiTitle(title).toLocaleLowerCase().endsWith(" (criatura)");
};

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

const singularizeMonsterTitle = (title: string) => {
	return normalizeWikiTitle(title).split(" ").map(singularizeMonsterWord).join(" ");
};

const uniqueTitles = (titles: string[]) => {
	return [...new Set(titles.map(normalizeWikiTitle).filter(Boolean))];
};

const monsterTitleCandidates = (title: string, lookupId?: string) => {
	return uniqueTitles([title, singularizeMonsterTitle(title), lookupId ?? ""]);
};

const directPageCandidates = (title: string, kind: WikiEntityKind, lookupId?: string) => {
	const titles = kind === "monster" ? monsterTitleCandidates(title, lookupId) : [normalizeWikiTitle(title)];
	return uniqueTitles(
		kind === "monster"
			? titles.flatMap((candidate) => {
					return [candidate, `${candidate} (Criatura)`];
				})
			: titles,
	);
};

const findSearchPage = (pages: Record<string, unknown>[], query: string, kind: WikiEntityKind) => {
	const normalizedQuery = normalizeWikiTitle(query).toLocaleLowerCase();
	const exactPage = pages.find((page) => {
		return (
			typeof page.title === "string" &&
			(normalizeWikiTitle(page.title).toLocaleLowerCase() === normalizedQuery || isCreatureTitle(page.title))
		);
	});
	if (exactPage && typeof exactPage.pageid === "number" && typeof exactPage.title === "string") {
		return { pageId: exactPage.pageid, title: exactPage.title };
	}

	if (kind !== "monster") {
		const firstPage = pages.find((page) => {
			return typeof page.pageid === "number" && typeof page.title === "string";
		});
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
	const availablePages = readQueryPages(queryPayload).filter((page) => {
		return page.missing !== true && typeof page.pageid === "number" && typeof page.title === "string";
	});

	const resolvedPage =
		(kind === "monster"
			? availablePages.find((page) => {
					return isCreatureTitle(page.title as string);
				})
			: undefined) ??
		availablePages.find((page) => {
			return directPageCandidates(normalizedTitle, kind, lookupId)
				.map((candidate) => {
					return candidate.toLocaleLowerCase();
				})
				.includes(normalizeWikiTitle(page.title as string).toLocaleLowerCase());
		}) ??
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

const extractInfoboxImageUrl = (html: string) => {
	const document = new DOMParser().parseFromString(html, "text/html");
	const source = document.querySelector("table.infobox img")?.getAttribute("src");
	if (!source) {
		return undefined;
	}

	try {
		const imageUrl = new URL(source, TIBIA_WIKI_ORIGIN);
		return imageUrl.origin === TIBIA_WIKI_ORIGIN && ["http:", "https:"].includes(imageUrl.protocol) ? imageUrl.href : undefined;
	} catch {
		return undefined;
	}
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
		imageUrl:
			kind === "monster" || kind === "rune" || kind === "item" || kind === "imbuement" ? extractInfoboxImageUrl(html) : undefined,
	};
};

const flattenWikiLayout = (document: Document) => {
	const parserOutput = document.querySelector(".mw-parser-output");
	if (!parserOutput) {
		return;
	}

	const infobox = parserOutput.querySelector("table.infobox");
	if (!infobox) {
		return;
	}

	const layoutTable = Array.from(parserOutput.querySelectorAll("table")).find((table) => {
		return table !== infobox && table.querySelector("table.infobox") === infobox;
	});
	const layoutRow = layoutTable?.querySelector("tbody > tr");
	const mainCell = layoutRow
		? Array.from(layoutRow.children).find((cell) => {
				return cell.querySelector("table.infobox") === infobox;
			})
		: undefined;

	if (layoutTable && mainCell) {
		const content = document.createDocumentFragment();
		while (mainCell.firstChild) {
			content.append(mainCell.firstChild);
		}
		layoutTable.replaceWith(content);
	}
};

const simplifyRuneWikiLayout = (document: Document) => {
	const parserOutput = document.querySelector(".mw-parser-output");
	if (!parserOutput) {
		return;
	}

	const disambiguationTable = Array.from(parserOutput.children).find((element) => {
		return (
			element.tagName === "TABLE" &&
			/este artigo é sobre/i.test(element.textContent ?? "") &&
			/para a criatura/i.test(element.textContent ?? "")
		);
	});
	disambiguationTable?.remove();

	flattenWikiLayout(document);

	const infobox = parserOutput.querySelector("table.infobox");
	if (!infobox) {
		return;
	}

	infobox.querySelector("tbody > tr")?.remove();
};

const removeSpellNavigationList = (document: Document) => {
	const parserOutput = document.querySelector(".mw-parser-output");
	if (!parserOutput) {
		return;
	}

	Array.from(parserOutput.children)
		.filter((element) => {
			return element.tagName === "CENTER" && /magias no tibia/i.test(element.textContent ?? "");
		})
		.forEach((element) => {
			element.remove();
		});
};

const removeRunePurchaseSection = (document: Document) => {
	const normalizeLabel = (value: string) => {
		return value.replace(/\s+/g, " ").replace(/:\s*$/, "").trim().toLocaleLowerCase();
	};

	const purchaseRow = Array.from(document.querySelectorAll("tr")).find((row) => {
		const firstCell = row.cells[0];
		return firstCell && normalizeLabel(firstCell.textContent ?? "") === "compra runas de";
	});
	const purchaseTable = purchaseRow?.closest("table");
	if (!purchaseTable) {
		return;
	}

	const containerRow = purchaseTable.parentElement?.closest("tr");
	purchaseTable.remove();
	if (containerRow && !containerRow.textContent?.trim() && !containerRow.querySelector("table, img, a")) {
		containerRow.remove();
	}
};

const removeUnneededWikiRows = (document: Document) => {
	const removableLabels = new Set(["notas", "historia", "premium", "adicionado", "valor", "atualizada"]);
	const normalizeLabel = (value: string) => {
		return value
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/:\s*$/, "")
			.trim()
			.toLocaleLowerCase();
	};

	for (const infobox of Array.from(document.querySelectorAll<HTMLTableElement>("table.infobox"))) {
		const body = infobox.tBodies[0];
		if (!body) {
			continue;
		}

		for (const row of Array.from(body.rows)) {
			if (!row.textContent?.trim() && !row.querySelector("img, a, table")) {
				row.remove();
				continue;
			}

			const firstCell = row.cells[0];
			if (firstCell && removableLabels.has(normalizeLabel(firstCell.textContent ?? ""))) {
				row.remove();
			}
		}
	}
};

export const sanitizeWikiHtml = (html: string, kind: WikiEntityKind = "spell") => {
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

	if (kind === "rune") {
		simplifyRuneWikiLayout(document);
		removeRunePurchaseSection(document);
	} else if (kind === "spell") {
		flattenWikiLayout(document);
		removeSpellNavigationList(document);
	}

	if (kind !== "monster") {
		removeUnneededWikiRows(document);
	}

	return document.body.innerHTML;
};
