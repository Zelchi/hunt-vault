import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

import CustomScrollbar from "@/components/custom-scrollbar";
import { SearchIcon } from "@/components/icons";
import {
	type EntityCatalog,
	type EntitySearchResult,
	loadEntityCatalog,
	normalizeSearchText,
	searchCatalog,
	searchWikiCreatures,
	searchWikiItems,
} from "@/lib/entity-search";
import * as styles from "@/styles/entity-search.css";

type EntitySearchProps = {
	onSelect: (result: EntitySearchResult) => void;
};

const resultKindLabel: Record<EntitySearchResult["kind"], string> = {
	monster: "Monstro",
	spell: "Habilidade",
	rune: "Runa",
	item: "Item",
};

const hideBrokenImage = (event: Event) => {
	(event.currentTarget as HTMLImageElement).hidden = true;
};

const showLoadedImage = (event: Event) => {
	(event.currentTarget as HTMLImageElement).hidden = false;
};

const mergeResults = (catalogResults: EntitySearchResult[], remoteResults: EntitySearchResult[]) => {
	const uniqueResults = new Map<string, EntitySearchResult>();
	for (const result of [...catalogResults, ...remoteResults]) {
		const key = `${result.kind}:${normalizeSearchText(result.title)}`;
		const existingResult = uniqueResults.get(key);
		if (!existingResult) {
			uniqueResults.set(key, result);
		} else if (result.isBoss && !existingResult.isBoss) {
			uniqueResults.set(key, { ...existingResult, isBoss: true, snippet: "Boss da TibiaWiki" });
		}
	}
	return [...uniqueResults.values()];
};

const SearchResultButton = (props: {
	result: EntitySearchResult;
	isActive: () => boolean;
	onHover: () => void;
	onSelect: (result: EntitySearchResult) => void;
}) => (
	<button
		class={styles.result}
		data-active={props.isActive()}
		type="button"
		onMouseEnter={props.onHover}
		onClick={() => props.onSelect(props.result)}
	>
		<Show when={props.result.imageUrl}>
			<img
				class={styles.resultImage}
				src={props.result.imageUrl}
				alt=""
				loading="lazy"
				decoding="async"
				onLoad={showLoadedImage}
				onError={hideBrokenImage}
			/>
		</Show>
		<span class={styles.resultBody}>
			<span class={styles.resultTopline}>
				<strong class={styles.resultTitle}>{props.result.title}</strong>
				<span class={styles.resultKind}>{props.result.isBoss ? "Boss" : resultKindLabel[props.result.kind]}</span>
			</span>
			<span class={styles.resultSnippet}>{props.result.snippet}</span>
		</span>
	</button>
);

export default (props: EntitySearchProps) => {
	const [query, setQuery] = createSignal("");
	const [results, setResults] = createSignal<EntitySearchResult[]>([]);
	const [catalog, setCatalog] = createSignal<EntityCatalog>({ monsters: [], spells: [], runes: [] });
	const [catalogReady, setCatalogReady] = createSignal(false);
	const [itemSearchLoading, setItemSearchLoading] = createSignal(false);
	const [open, setOpen] = createSignal(false);
	const [activeIndex, setActiveIndex] = createSignal(-1);
	let searchRoot!: HTMLDivElement;
	let searchInput!: HTMLInputElement;
	let itemSearchController: AbortController | undefined;
	let itemSearchTimer: number | undefined;
	const bossResults = () => results().filter((result) => result.kind === "monster" && result.isBoss === true);
	const monsterResults = () => results().filter((result) => result.kind === "monster" && result.isBoss !== true);
	const otherResults = () => results().filter((result) => result.kind !== "monster");
	const visibleResults = () => [...bossResults(), ...monsterResults(), ...otherResults()];
	const resultIndex = (result: EntitySearchResult) => visibleResults().findIndex((candidate) => candidate.id === result.id);

	const cancelItemSearch = () => {
		if (itemSearchTimer !== undefined) {
			window.clearTimeout(itemSearchTimer);
			itemSearchTimer = undefined;
		}
		itemSearchController?.abort();
		itemSearchController = undefined;
		setItemSearchLoading(false);
	};

	const clearSearch = () => {
		cancelItemSearch();
		setQuery("");
		setResults([]);
		setActiveIndex(-1);
		setOpen(false);
		searchInput.focus();
	};

	const selectResult = (result: EntitySearchResult) => {
		cancelItemSearch();
		setQuery(result.title);
		setOpen(false);
		setActiveIndex(-1);
		props.onSelect(result);
	};

	const handleInput = (event: InputEvent) => {
		const value = (event.currentTarget as HTMLInputElement).value;
		setQuery(value);
		setOpen(true);
		setActiveIndex(-1);
		cancelItemSearch();
		setResults(searchCatalog(catalog(), value));

		if (normalizeSearchText(value).length < 2) {
			return;
		}

		setItemSearchLoading(true);
		itemSearchTimer = window.setTimeout(() => {
			itemSearchTimer = undefined;
			const controller = new AbortController();
			itemSearchController = controller;
			void Promise.allSettled([searchWikiItems(value, controller.signal), searchWikiCreatures(value, controller.signal)])
				.then((searches) => {
					if (!controller.signal.aborted) {
						const remoteResults = searches.flatMap((search) => (search.status === "fulfilled" ? search.value : []));
						setResults(mergeResults(searchCatalog(catalog(), value), remoteResults));
					}
				})
				.finally(() => {
					if (itemSearchController === controller) {
						setItemSearchLoading(false);
					}
				});
		}, 220);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Escape") {
			setOpen(false);
			setActiveIndex(-1);
			return;
		}

		const navigableResults = visibleResults();
		if (!open() || navigableResults.length === 0) {
			return;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActiveIndex((index) => (index + 1) % navigableResults.length);
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((index) => (index <= 0 ? navigableResults.length - 1 : index - 1));
		}

		if (event.key === "Enter" && activeIndex() >= 0) {
			event.preventDefault();
			const result = navigableResults[activeIndex()];
			if (result) {
				selectResult(result);
			}
		}
	};

	onMount(() => {
		const handleOutsidePointer = (event: PointerEvent) => {
			if (!searchRoot.contains(event.target as Node)) {
				setOpen(false);
				setActiveIndex(-1);
			}
		};

		document.addEventListener("pointerdown", handleOutsidePointer);

		void loadEntityCatalog().then((nextCatalog) => {
			setCatalog(nextCatalog);
			setCatalogReady(true);

			if (query().trim()) {
				const currentRemoteResults = results().filter((result) => result.source === "tibiawiki");
				setResults(mergeResults(searchCatalog(nextCatalog, query()), currentRemoteResults));
			}
		});

		onCleanup(() => {
			cancelItemSearch();
			document.removeEventListener("pointerdown", handleOutsidePointer);
		});
	});

	return (
		<div ref={searchRoot} class={styles.searchSlot}>
			<div class={styles.searchForm}>
				<span class={styles.searchIcon}>
					<SearchIcon size={17} />
				</span>
				<input
					ref={searchInput}
					class={styles.searchInput}
					value={query()}
					type="search"
					role="combobox"
					placeholder="Pesquisar monstros, itens, habilidades ou runas..."
					aria-label="Pesquisar monstros, itens, habilidades ou runas"
					aria-controls="entity-search-results"
					aria-expanded={open()}
					aria-autocomplete="list"
					onInput={handleInput}
					onFocus={() => {
						if (query().trim()) {
							setOpen(true);
						}
					}}
					onKeyDown={handleKeyDown}
				/>
				<Show when={query()}>
					<button class={styles.clearButton} type="button" aria-label="Limpar pesquisa" onClick={clearSearch}>
						×
					</button>
				</Show>
			</div>

			<Show when={open() && query().trim().length > 0}>
				<CustomScrollbar
					variant="nested"
					scrollbarVariant="minimal"
					id="entity-search-results"
					ariaLabel="Rolagem dos resultados da pesquisa"
					viewportRole="listbox"
					viewportAriaLabel="Resultados da busca"
					class={styles.resultsPanel}
					viewportClass={styles.resultsViewport}
				>
					<Show when={results().length > 0}>
						<Show when={bossResults().length > 0}>
							<div class={styles.resultGroupTitle}>Bosses</div>
							<For each={bossResults()}>
								{(result) => (
									<SearchResultButton
										result={result}
										isActive={() => activeIndex() === resultIndex(result)}
										onHover={() => setActiveIndex(resultIndex(result))}
										onSelect={selectResult}
									/>
								)}
							</For>
						</Show>

						<Show when={monsterResults().length > 0}>
							<div class={styles.resultGroupTitle}>Monstros</div>
							<For each={monsterResults()}>
								{(result) => (
									<SearchResultButton
										result={result}
										isActive={() => activeIndex() === resultIndex(result)}
										onHover={() => setActiveIndex(resultIndex(result))}
										onSelect={selectResult}
									/>
								)}
							</For>
						</Show>

						<Show when={otherResults().length > 0}>
							<div class={styles.resultGroupTitle}>Outros resultados</div>
							<For each={otherResults()}>
								{(result) => (
									<SearchResultButton
										result={result}
										isActive={() => activeIndex() === resultIndex(result)}
										onHover={() => setActiveIndex(resultIndex(result))}
										onSelect={selectResult}
									/>
								)}
							</For>
						</Show>
					</Show>

					<Show when={!catalogReady()}>
						<div class={styles.searchStatus}>Carregando catálogo oficial...</div>
					</Show>
					<Show when={itemSearchLoading()}>
						<div class={styles.searchStatus}>Procurando itens e bosses na TibiaWiki...</div>
					</Show>
					<Show when={!itemSearchLoading() && catalogReady() && results().length === 0}>
						<div class={styles.searchStatus}>Nenhuma entidade encontrada nos catálogos oficiais.</div>
					</Show>
				</CustomScrollbar>
			</Show>
		</div>
	);
};
