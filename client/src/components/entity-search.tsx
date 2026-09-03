import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

import CustomScrollbar from "@/components/custom-scrollbar";
import { SearchIcon } from "@/components/icons";
import {
	type EntityCatalog,
	type EntitySearchResult,
	loadEntityCatalog,
	normalizeSearchText,
	searchCatalog,
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

const mergeResults = (catalogResults: EntitySearchResult[], itemResults: EntitySearchResult[]) => {
	const uniqueResults = new Map<string, EntitySearchResult>();
	for (const result of [...catalogResults, ...itemResults]) {
		uniqueResults.set(result.id, result);
	}
	return [...uniqueResults.values()];
};

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
			void searchWikiItems(value, controller.signal)
				.then((itemResults) => {
					if (!controller.signal.aborted) {
						setResults(mergeResults(searchCatalog(catalog(), value), itemResults));
					}
				})
				.catch(() => undefined)
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

		if (!open() || results().length === 0) {
			return;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActiveIndex((index) => (index + 1) % results().length);
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((index) => (index <= 0 ? results().length - 1 : index - 1));
		}

		if (event.key === "Enter" && activeIndex() >= 0) {
			event.preventDefault();
			const result = results()[activeIndex()];
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
				const currentItemResults = results().filter((result) => result.kind === "item");
				setResults(mergeResults(searchCatalog(nextCatalog, query()), currentItemResults));
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
					viewportAriaLabel="Resultados do catálogo oficial"
					class={styles.resultsPanel}
					viewportClass={styles.resultsViewport}
				>
					<Show when={results().length > 0}>
						<For each={results()}>
							{(result, index) => (
								<button
									class={styles.result}
									data-active={activeIndex() === index()}
									type="button"
									onMouseEnter={() => setActiveIndex(index())}
									onClick={() => selectResult(result)}
								>
									<Show when={result.imageUrl}>
										<img
											class={styles.resultImage}
											src={result.imageUrl}
											alt=""
											loading="lazy"
											decoding="async"
											onLoad={showLoadedImage}
											onError={hideBrokenImage}
										/>
									</Show>
									<span class={styles.resultBody}>
										<span class={styles.resultTopline}>
											<strong class={styles.resultTitle}>{result.title}</strong>
											<span class={styles.resultKind}>{resultKindLabel[result.kind]}</span>
										</span>
										<span class={styles.resultSnippet}>{result.snippet}</span>
									</span>
								</button>
							)}
						</For>
					</Show>

					<Show when={!catalogReady()}>
						<div class={styles.searchStatus}>Carregando catálogo oficial...</div>
					</Show>
					<Show when={itemSearchLoading()}>
						<div class={styles.searchStatus}>Procurando itens na TibiaWiki...</div>
					</Show>
					<Show when={!itemSearchLoading() && catalogReady() && results().length === 0}>
						<div class={styles.searchStatus}>Nenhuma entidade encontrada nos catálogos oficiais.</div>
					</Show>
				</CustomScrollbar>
			</Show>
		</div>
	);
};
