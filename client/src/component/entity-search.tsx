import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

import CustomScrollbar from "@/component/custom-scrollbar";
import { SearchIcon } from "@/component/icons";
import { EMPTY_ENTITY_CATALOG, ENTITY_KIND_LABEL, ENTITY_SEARCH_FILTERS } from "@/const/entity";
import {
	cacheSearchResults,
	cacheTibiaWatchHunts,
	getCachedSearchResults,
	getCachedTibiaWatchHunts,
	loadEntityCatalog,
	mergeSearchResults,
	normalizeSearchText,
	searchCatalog,
	searchTibiaWatchHunts,
	searchWikiCreatures,
	searchWikiImbuements,
	searchWikiItems,
	searchWikiRunes,
	searchWikiSpells,
} from "@/lib/entity-search";
import * as styles from "@/style/entity-search.css";
import type { EntitySearchProps, SearchResultButtonProps } from "@/type/components";
import type { EntityCatalog, EntitySearchFilter, EntitySearchResult, HuntSearchResult } from "@/type/entity";

const hideBrokenImage = (event: Event) => {
	(event.currentTarget as HTMLImageElement).hidden = true;
};

const showLoadedImage = (event: Event) => {
	(event.currentTarget as HTMLImageElement).hidden = false;
};

const SearchResultButton = (props: SearchResultButtonProps) => {
	return (
		<button
			class={styles.result}
			data-active={props.isActive()}
			type="button"
			onMouseEnter={props.onHover}
			onClick={() => {
				return props.onSelect(props.result);
			}}
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
					<span class={styles.resultBadges}>
						<Show when={props.result.kind === "hunt" ? props.result.huntCode : undefined}>
							{(huntCode) => {
								return (
									<span class={styles.resultCode} title="Código da hunt">
										{huntCode()}
									</span>
								);
							}}
						</Show>
						<span class={styles.resultKind}>{props.result.isBoss ? "Boss" : ENTITY_KIND_LABEL[props.result.kind]}</span>
					</span>
				</span>
			</span>
		</button>
	);
};

export default (props: EntitySearchProps) => {
	const [query, setQuery] = createSignal("");
	const [results, setResults] = createSignal<EntitySearchResult[]>([]);
	const [catalog, setCatalog] = createSignal<EntityCatalog>(EMPTY_ENTITY_CATALOG);
	const [catalogReady, setCatalogReady] = createSignal(false);
	const [itemSearchLoading, setItemSearchLoading] = createSignal(false);
	const [open, setOpen] = createSignal(false);
	const [activeIndex, setActiveIndex] = createSignal(-1);
	const [selectedFilters, setSelectedFilters] = createSignal<EntitySearchFilter[]>([]);
	let searchRoot!: HTMLDivElement;
	let searchInput!: HTMLInputElement;
	let itemSearchController: AbortController | undefined;
	let itemSearchTimer: number | undefined;
	const matchesFilter = (result: EntitySearchResult, filter: EntitySearchFilter) => {
		if (filter === "boss") {
			return result.kind === "monster" && result.isBoss === true;
		}
		if (filter === "monster") {
			return result.kind === "monster" && result.isBoss !== true;
		}
		return result.kind === filter;
	};
	const filteredResults = () => {
		const filters = selectedFilters();
		if (filters.length === 0) {
			return results();
		}

		return results().filter((result) => {
			return filters.some((filter) => {
				return matchesFilter(result, filter);
			});
		});
	};
	const huntResults = () => {
		return filteredResults().filter((result) => {
			return result.kind === "hunt";
		});
	};
	const bossResults = () => {
		return filteredResults().filter((result) => {
			return result.kind === "monster" && result.isBoss === true;
		});
	};
	const monsterResults = () => {
		return filteredResults().filter((result) => {
			return result.kind === "monster" && result.isBoss !== true;
		});
	};
	const imbuementResults = () => {
		return filteredResults().filter((result) => {
			return result.kind === "imbuement";
		});
	};
	const runeResults = () => {
		return filteredResults().filter((result) => {
			return result.kind === "rune";
		});
	};
	const spellResults = () => {
		return filteredResults().filter((result) => {
			return result.kind === "spell";
		});
	};
	const otherResults = () => {
		return filteredResults().filter((result) => {
			return (
				result.kind !== "monster" &&
				result.kind !== "imbuement" &&
				result.kind !== "rune" &&
				result.kind !== "spell" &&
				result.kind !== "hunt"
			);
		});
	};
	const visibleResults = () => {
		return [
			...imbuementResults(),
			...runeResults(),
			...spellResults(),
			...bossResults(),
			...monsterResults(),
			...huntResults(),
			...otherResults(),
		];
	};
	const resultIndex = (result: EntitySearchResult) => {
		return visibleResults().findIndex((candidate) => {
			return candidate.id === result.id;
		});
	};
	const selectFilter = (filter: EntitySearchFilter) => {
		setSelectedFilters((currentFilters) => {
			if (currentFilters.includes(filter)) {
				return currentFilters.filter((currentFilter) => {
					return currentFilter !== filter;
				});
			}

			return [...currentFilters, filter];
		});
		setActiveIndex(-1);
	};

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
		const localResults = searchCatalog(catalog(), value);
		setResults(mergeSearchResults(localResults, [...getCachedSearchResults(value), ...getCachedTibiaWatchHunts(value)]));

		if (normalizeSearchText(value).length < 2) {
			return;
		}

		setItemSearchLoading(true);
		itemSearchTimer = window.setTimeout(() => {
			itemSearchTimer = undefined;
			const controller = new AbortController();
			itemSearchController = controller;
			void Promise.allSettled([
				searchWikiItems(value, controller.signal),
				searchWikiCreatures(value, controller.signal),
				searchWikiSpells(value, controller.signal),
				searchWikiRunes(value, controller.signal),
				searchWikiImbuements(value, controller.signal),
				searchTibiaWatchHunts(value, controller.signal),
			])
				.then((searches) => {
					if (!controller.signal.aborted) {
						const remoteResults = searches.flatMap((search) => {
							return search.status === "fulfilled" ? search.value : [];
						});
						const remoteHunts = remoteResults.filter((result): result is HuntSearchResult => {
							return result.kind === "hunt";
						});
						cacheSearchResults(
							value,
							remoteResults.filter((result) => {
								return result.source === "tibiawiki";
							}),
						);
						cacheTibiaWatchHunts(value, remoteHunts);
						setResults(
							mergeSearchResults(searchCatalog(catalog(), value), [
								...getCachedSearchResults(value),
								...getCachedTibiaWatchHunts(value),
								...remoteResults,
							]),
						);
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
			setActiveIndex((index) => {
				return (index + 1) % navigableResults.length;
			});
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((index) => {
				return index <= 0 ? navigableResults.length - 1 : index - 1;
			});
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
				const currentResults = results();
				setResults(
					mergeSearchResults(searchCatalog(nextCatalog, query()), [
						...getCachedSearchResults(query()),
						...getCachedTibiaWatchHunts(query()),
						...currentResults,
					]),
				);
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
					placeholder="Pesquisar criaturas, itens, imbuements, habilidades ou runas..."
					aria-label="Pesquisar criaturas, itens, imbuements, habilidades ou runas"
					aria-controls="entity-search-results"
					aria-expanded={open()}
					aria-autocomplete="list"
					onInput={handleInput}
					onFocus={() => {
						return setOpen(true);
					}}
					onKeyDown={handleKeyDown}
				/>
				<Show when={query()}>
					<Show
						when={itemSearchLoading()}
						fallback={
							<button class={styles.clearButton} type="button" aria-label="Limpar pesquisa" onClick={clearSearch}>
								×
							</button>
						}
					>
						<span class={styles.clearButton} role="status" aria-label="Carregando pesquisa">
							<span class={styles.loadingIndicator} />
						</span>
					</Show>
				</Show>
			</div>

			<Show when={open() && query().trim().length > 0}>
				<CustomScrollbar
					variant="nested"
					id="entity-search-results"
					ariaLabel="Rolagem dos resultados da pesquisa"
					viewportRole="listbox"
					viewportAriaLabel="Resultados da busca"
					class={styles.resultsPanel}
					viewportClass={styles.resultsViewport}
				>
					<nav class={styles.filterBar} aria-label="Filtrar resultados da pesquisa">
						<For each={ENTITY_SEARCH_FILTERS}>
							{(filter) => {
								return (
									<button
										class={styles.filterButton}
										data-active={selectedFilters().includes(filter.value)}
										aria-pressed={selectedFilters().includes(filter.value)}
										type="button"
										onClick={() => {
											return selectFilter(filter.value);
										}}
									>
										{filter.label}
									</button>
								);
							}}
						</For>
					</nav>

					<Show when={results().length > 0}>
						<Show when={imbuementResults().length > 0}>
							<div class={styles.resultGroupTitle}>Imbuements</div>
							<For each={imbuementResults()}>
								{(result) => {
									return (
										<SearchResultButton
											result={result}
											isActive={() => {
												return activeIndex() === resultIndex(result);
											}}
											onHover={() => {
												return setActiveIndex(resultIndex(result));
											}}
											onSelect={selectResult}
										/>
									);
								}}
							</For>
						</Show>

						<Show when={runeResults().length > 0}>
							<div class={styles.resultGroupTitle}>Runas</div>
							<For each={runeResults()}>
								{(result) => {
									return (
										<SearchResultButton
											result={result}
											isActive={() => {
												return activeIndex() === resultIndex(result);
											}}
											onHover={() => {
												return setActiveIndex(resultIndex(result));
											}}
											onSelect={selectResult}
										/>
									);
								}}
							</For>
						</Show>

						<Show when={spellResults().length > 0}>
							<div class={styles.resultGroupTitle}>Habilidades</div>
							<For each={spellResults()}>
								{(result) => {
									return (
										<SearchResultButton
											result={result}
											isActive={() => {
												return activeIndex() === resultIndex(result);
											}}
											onHover={() => {
												return setActiveIndex(resultIndex(result));
											}}
											onSelect={selectResult}
										/>
									);
								}}
							</For>
						</Show>

						<Show when={bossResults().length > 0}>
							<div class={styles.resultGroupTitle}>Bosses</div>
							<For each={bossResults()}>
								{(result) => {
									return (
										<SearchResultButton
											result={result}
											isActive={() => {
												return activeIndex() === resultIndex(result);
											}}
											onHover={() => {
												return setActiveIndex(resultIndex(result));
											}}
											onSelect={selectResult}
										/>
									);
								}}
							</For>
						</Show>

						<Show when={monsterResults().length > 0}>
							<div class={styles.resultGroupTitle}>Criaturas</div>
							<For each={monsterResults()}>
								{(result) => {
									return (
										<SearchResultButton
											result={result}
											isActive={() => {
												return activeIndex() === resultIndex(result);
											}}
											onHover={() => {
												return setActiveIndex(resultIndex(result));
											}}
											onSelect={selectResult}
										/>
									);
								}}
							</For>
						</Show>

						<Show when={huntResults().length > 0}>
							<div class={styles.resultGroupTitle}>Hunts</div>
							<For each={huntResults()}>
								{(result) => {
									return (
										<SearchResultButton
											result={result}
											isActive={() => {
												return activeIndex() === resultIndex(result);
											}}
											onHover={() => {
												return setActiveIndex(resultIndex(result));
											}}
											onSelect={selectResult}
										/>
									);
								}}
							</For>
						</Show>

						<Show when={otherResults().length > 0}>
							<div class={styles.resultGroupTitle}>Outros resultados</div>
							<For each={otherResults()}>
								{(result) => {
									return (
										<SearchResultButton
											result={result}
											isActive={() => {
												return activeIndex() === resultIndex(result);
											}}
											onHover={() => {
												return setActiveIndex(resultIndex(result));
											}}
											onSelect={selectResult}
										/>
									);
								}}
							</For>
						</Show>
					</Show>

					<Show when={!catalogReady()}>
						<div class={styles.searchStatus}>Carregando catálogo...</div>
					</Show>
					<Show when={!itemSearchLoading() && catalogReady() && results().length === 0}>
						<div class={styles.searchStatus}>Nenhuma entidade encontrada.</div>
					</Show>
				</CustomScrollbar>
			</Show>
		</div>
	);
};
