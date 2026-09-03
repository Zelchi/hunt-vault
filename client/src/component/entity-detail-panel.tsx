import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";

import CustomScrollbar from "@/component/custom-scrollbar";
import { CREATURE_RESISTANCE_KIND_LABEL, ENTITY_KIND_LABEL } from "@/const/entity";
import { HUNT_DIFFICULTY_LABEL } from "@/const/tibiawatch";
import {
	extractCreatureSummary,
	extractImbuementSummary,
	extractItemSummary,
	fetchWikiDetails,
	sanitizeWikiHtml,
} from "@/lib/entity-details";
import { fetchTibiaWatchHuntDetails } from "@/lib/entity-search";
import * as styles from "@/style/entity-detail-panel.css";
import type {
	CreatureSummaryViewProps,
	EntityDetailPanelProps,
	HuntDetailField,
	HuntSummaryViewProps,
	ImbuementSummaryViewProps,
	ItemSummaryViewProps,
} from "@/type/components";
import type { CreatureResistance, CreatureSummary, ImbuementSummary, ItemSummary, WikiPageDetails } from "@/type/entity-details";
import type { TibiaWatchRespawnDetails } from "@/type/tibiawatch";

const hideBrokenImage = (event: Event) => {
	(event.currentTarget as HTMLImageElement).hidden = true;
};

const resistanceGroups = (resistances: CreatureResistance[]) => {
	return [
		{
			label: "Bons para atacar",
			items: resistances.filter((resistance) => {
				return resistance.kind === "weak";
			}),
		},
		{
			label: "Ruins para atacar",
			items: resistances.filter((resistance) => {
				return ["immune", "strong", "healed"].includes(resistance.kind);
			}),
		},
		{
			label: "Neutros",
			items: resistances.filter((resistance) => {
				return resistance.kind === "neutral";
			}),
		},
	];
};

const CreatureSummaryView = (props: CreatureSummaryViewProps) => {
	return (
		<div class={styles.creatureSummary}>
			<section class={styles.summarySection}>
				<h3 class={styles.summaryTitle}>Resistências</h3>
				<Show
					when={props.summary.resistances.length > 0}
					fallback={<p class={styles.summaryEmpty}>Nenhuma resistência informada.</p>}
				>
					<For each={resistanceGroups(props.summary.resistances)}>
						{(group) => {
							return (
								<Show when={group.items.length > 0}>
									<div class={styles.resistanceGroup}>
										<h4 class={styles.resistanceGroupTitle}>{group.label}</h4>
										<div class={styles.resistanceGrid}>
											<For each={group.items}>
												{(resistance) => {
													return (
														<div class={styles.resistanceItem} data-type={resistance.kind}>
															<span class={styles.resistanceLabel}>
																<Show when={resistance.iconUrl}>
																	<img
																		class={styles.resistanceIcon}
																		src={resistance.iconUrl}
																		alt=""
																		loading="lazy"
																	/>
																</Show>
																{resistance.label}
															</span>
															<strong>{resistance.value}</strong>
															<small>{CREATURE_RESISTANCE_KIND_LABEL[resistance.kind]}</small>
														</div>
													);
												}}
											</For>
										</div>
									</div>
								</Show>
							);
						}}
					</For>
				</Show>
			</section>

			<section class={styles.summarySection}>
				<h3 class={styles.summaryTitle}>Loot</h3>
				<Show when={props.summary.loot.length > 0} fallback={<p class={styles.summaryEmpty}>Nenhum loot informado.</p>}>
					<ul class={styles.lootList}>
						<For each={props.summary.loot}>
							{(item) => {
								return <li>{item}</li>;
							}}
						</For>
					</ul>
				</Show>
			</section>
		</div>
	);
};

const ItemSummaryView = (props: ItemSummaryViewProps) => {
	return (
		<div class={styles.itemSummary}>
			<Show when={props.summary} fallback={<p class={styles.summaryEmpty}>Nenhum resumo do item foi informado.</p>}>
				{(summary) => {
					return (
						<>
							<Show when={summary().attributes.length > 0}>
								<section class={styles.summarySection}>
									<h3 class={styles.summaryTitle}>Informações</h3>
									<div class={styles.itemStats}>
										<For each={summary().attributes}>
											{(attribute) => {
												return (
													<div class={styles.itemStat}>
														<span class={styles.itemStatLabel}>{attribute.label}</span>
														<strong class={styles.itemStatValue}>{attribute.value}</strong>
													</div>
												);
											}}
										</For>
									</div>
								</section>
							</Show>

							<Show when={summary().description}>
								<section class={styles.summarySection}>
									<h3 class={styles.summaryTitle}>Descrição</h3>
									<p class={styles.itemDescription}>{summary().description}</p>
								</section>
							</Show>

							<Show when={summary().sources.length > 0}>
								<section class={styles.summarySection}>
									<h3 class={styles.summaryTitle}>Onde encontrar</h3>
									<div class={styles.itemSourceList}>
										<For each={summary().sources}>
											{(source) => {
												return (
													<div class={styles.itemSource}>
														<span class={styles.itemSourceLabel}>{source.label}</span>
														<span class={styles.itemSourceValue}>{source.value}</span>
													</div>
												);
											}}
										</For>
									</div>
								</section>
							</Show>
						</>
					);
				}}
			</Show>
		</div>
	);
};

const ImbuementSummaryView = (props: ImbuementSummaryViewProps) => {
	return (
		<div class={styles.itemSummary}>
			<Show when={props.summary} fallback={<p class={styles.summaryEmpty}>Nenhum resumo do imbuement foi informado.</p>}>
				{(summary) => {
					return (
						<>
							<Show when={summary().attributes.length > 0}>
								<section class={styles.summarySection}>
									<h3 class={styles.summaryTitle}>Informações</h3>
									<div class={styles.itemStats}>
										<For each={summary().attributes}>
											{(attribute) => {
												return (
													<div class={styles.itemStat}>
														<span class={styles.itemStatLabel}>{attribute.label}</span>
														<strong class={styles.itemStatValue}>{attribute.value}</strong>
													</div>
												);
											}}
										</For>
									</div>
								</section>
							</Show>

							<Show when={summary().effects.length > 0}>
								<section class={styles.summarySection}>
									<h3 class={styles.summaryTitle}>Efeitos</h3>
									<div class={styles.itemSourceList}>
										<For each={summary().effects}>
											{(effect) => {
												return (
													<div class={styles.itemSource}>
														<span class={styles.itemSourceLabel}>{effect.label}</span>
														<span class={styles.itemSourceValue}>{effect.value}</span>
													</div>
												);
											}}
										</For>
									</div>
								</section>
							</Show>

							<Show when={summary().materials.length > 0}>
								<section class={styles.summarySection}>
									<h3 class={styles.summaryTitle}>Materiais</h3>
									<div class={styles.itemSourceList}>
										<For each={summary().materials}>
											{(material) => {
												return (
													<div class={styles.itemSource}>
														<span class={styles.itemSourceLabel}>{material.label}</span>
														<span class={styles.imbuementMaterialValue}>
															<Show when={material.imageUrl}>
																<img
																	class={styles.imbuementMaterialIcon}
																	src={material.imageUrl}
																	alt=""
																	loading="lazy"
																	onError={hideBrokenImage}
																/>
															</Show>
															<span class={styles.itemSourceValue}>{material.value}</span>
														</span>
													</div>
												);
											}}
										</For>
									</div>
								</section>
							</Show>
						</>
					);
				}}
			</Show>
		</div>
	);
};

const formatHuntLevel = (minLevel?: number, maxLevel?: number) => {
	const hasMinLevel = typeof minLevel === "number" && minLevel > 0;
	const hasMaxLevel = typeof maxLevel === "number" && maxLevel > 0;
	if (hasMinLevel && hasMaxLevel) {
		return `${minLevel}-${maxLevel}`;
	}
	if (hasMinLevel) {
		return `${minLevel}+`;
	}
	if (hasMaxLevel) {
		return `Até ${maxLevel}`;
	}
	return undefined;
};

const formatHuntRate = (textValue?: string, numericValue?: number) => {
	if (textValue?.trim()) {
		return textValue.trim();
	}
	if (typeof numericValue === "number" && numericValue > 0) {
		return new Intl.NumberFormat("pt-BR").format(numericValue);
	}
	return undefined;
};

const getHuntDifficultyLabel = (difficulty?: string) => {
	if (!difficulty?.trim()) {
		return undefined;
	}

	const normalizedDifficulty = difficulty.trim().toLocaleLowerCase();
	return HUNT_DIFFICULTY_LABEL[normalizedDifficulty] ?? difficulty.trim();
};

const getHuntInformation = (details: TibiaWatchRespawnDetails): HuntDetailField[] => {
	const fields: Array<HuntDetailField | undefined> = [
		details.alias ? { label: "Código", value: details.alias } : undefined,
		details.city ? { label: "Cidade", value: details.city } : undefined,
		formatHuntLevel(details.minLevel, details.maxLevel)
			? { label: "Nível", value: formatHuntLevel(details.minLevel, details.maxLevel) ?? "" }
			: undefined,
		getHuntDifficultyLabel(details.difficulty)
			? { label: "Dificuldade", value: getHuntDifficultyLabel(details.difficulty) ?? "" }
			: undefined,
		details.vocations ? { label: "Vocações", value: details.vocations } : undefined,
		typeof details.premium === "boolean" ? { label: "Acesso", value: details.premium ? "Premium" : "Livre" } : undefined,
		details.status ? { label: "Status", value: details.status } : undefined,
	];

	return fields.filter((field): field is HuntDetailField => {
		return Boolean(field);
	});
};

const getHuntPerformance = (details: TibiaWatchRespawnDetails): HuntDetailField[] => {
	const expPerHour = formatHuntRate(details.avgExpPerHour, details.expPerHour);
	const lootPerHour = formatHuntRate(details.avgLootPerHour, details.profitPerHour);
	const fields: Array<HuntDetailField | undefined> = [
		expPerHour ? { label: "XP por hora", value: expPerHour } : undefined,
		lootPerHour ? { label: "Loot por hora", value: lootPerHour } : undefined,
	];

	return fields.filter((field): field is HuntDetailField => {
		return Boolean(field);
	});
};

const getHuntPreparation = (details: TibiaWatchRespawnDetails): HuntDetailField[] => {
	const fields: Array<HuntDetailField | undefined> = [
		details.imbuements ? { label: "Imbuements", value: details.imbuements } : undefined,
		details.supplies ? { label: "Suprimentos", value: details.supplies } : undefined,
		details.trinket ? { label: "Trinket", value: details.trinket } : undefined,
		details.questRequirements ? { label: "Requisitos de quest", value: details.questRequirements } : undefined,
	];

	return fields.filter((field): field is HuntDetailField => {
		return Boolean(field);
	});
};

const getYouTubeEmbedUrl = (videoUrl?: string) => {
	if (!videoUrl) {
		return undefined;
	}

	try {
		const url = new URL(videoUrl);
		const hostname = url.hostname.toLocaleLowerCase();
		let videoId = "";

		if (hostname === "youtu.be") {
			videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
		} else if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
			if (url.pathname === "/watch") {
				videoId = url.searchParams.get("v") ?? "";
			} else {
				const pathParts = url.pathname.split("/").filter(Boolean);
				if (["embed", "live", "shorts"].includes(pathParts[0] ?? "")) {
					videoId = pathParts[1] ?? "";
				}
			}
		}

		if (!videoId) {
			return undefined;
		}

		return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
	} catch {
		return undefined;
	}
};

const HuntSummaryView = (props: HuntSummaryViewProps) => {
	const details = props.details;
	const information = getHuntInformation(details);
	const performance = getHuntPerformance(details);
	const preparation = getHuntPreparation(details);
	const videoEmbedUrl = getYouTubeEmbedUrl(details.videoUrl);

	return (
		<div class={styles.itemSummary}>
			<Show when={information.length > 0}>
				<section class={styles.summarySection}>
					<h3 class={styles.summaryTitle}>Informações</h3>
					<div class={styles.itemStats}>
						<For each={information}>
							{(field) => {
								return (
									<div class={styles.itemStat}>
										<span class={styles.itemStatLabel}>{field.label}</span>
										<strong class={styles.itemStatValue}>{field.value}</strong>
									</div>
								);
							}}
						</For>
					</div>
				</section>
			</Show>

			<Show when={performance.length > 0}>
				<section class={styles.summarySection}>
					<h3 class={styles.summaryTitle}>Rendimento</h3>
					<div class={styles.itemStats}>
						<For each={performance}>
							{(field) => {
								return (
									<div class={styles.itemStat}>
										<span class={styles.itemStatLabel}>{field.label}</span>
										<strong class={styles.itemStatValue}>{field.value}</strong>
									</div>
								);
							}}
						</For>
					</div>
				</section>
			</Show>

			<Show when={details.description}>
				{(description) => {
					return (
						<section class={styles.summarySection}>
							<h3 class={styles.summaryTitle}>Descrição</h3>
							<p class={styles.itemDescription}>{description()}</p>
						</section>
					);
				}}
			</Show>

			<Show when={details.tags}>
				{(tags) => {
					return (
						<section class={styles.summarySection}>
							<h3 class={styles.summaryTitle}>Tags</h3>
							<p class={styles.itemDescription}>{tags()}</p>
						</section>
					);
				}}
			</Show>

			<Show when={preparation.length > 0}>
				<section class={styles.summarySection}>
					<h3 class={styles.summaryTitle}>Preparação</h3>
					<div class={styles.itemSourceList}>
						<For each={preparation}>
							{(field) => {
								return (
									<div class={styles.itemSource}>
										<span class={styles.itemSourceLabel}>{field.label}</span>
										<span class={styles.itemSourceValue}>{field.value}</span>
									</div>
								);
							}}
						</For>
					</div>
				</section>
			</Show>

			<Show when={videoEmbedUrl}>
				{(embedUrl) => {
					return (
						<section class={styles.summarySection}>
							<h3 class={styles.summaryTitle}>Vídeo</h3>
							<div class={styles.huntVideoFrame}>
								<iframe
									src={embedUrl()}
									title={`Vídeo da hunt ${details.name}`}
									loading="lazy"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowfullscreen
								/>
							</div>
						</section>
					);
				}}
			</Show>
		</div>
	);
};

export default (props: EntityDetailPanelProps) => {
	const [page, setPage] = createSignal<WikiPageDetails>();
	const [creatureSummary, setCreatureSummary] = createSignal<CreatureSummary>();
	const [itemSummary, setItemSummary] = createSignal<ItemSummary>();
	const [imbuementSummary, setImbuementSummary] = createSignal<ImbuementSummary>();
	const [huntDetails, setHuntDetails] = createSignal<TibiaWatchRespawnDetails>();
	const [loading, setLoading] = createSignal(true);
	const [error, setError] = createSignal("");
	let activeController: AbortController | undefined;
	const entityImageUrl = () => {
		return page()?.imageUrl ?? huntDetails()?.imageUrl ?? props.entity.imageUrl;
	};
	const entityTitle = () => {
		return page()?.title ?? huntDetails()?.name ?? props.entity.title;
	};

	createEffect(() => {
		const entity = props.entity;
		activeController?.abort();
		const controller = new AbortController();
		activeController = controller;
		setPage(undefined);
		setCreatureSummary(undefined);
		setItemSummary(undefined);
		setImbuementSummary(undefined);
		setHuntDetails(undefined);
		setError("");
		setLoading(true);

		const loadDetails = async () => {
			try {
				if (entity.source === "tibiawatch") {
					const nextHuntDetails = await fetchTibiaWatchHuntDetails(entity.lookupId ?? entity.id, controller.signal);
					if (controller.signal.aborted) {
						return;
					}

					setHuntDetails(nextHuntDetails);
				} else {
					const nextPage = await fetchWikiDetails(entity.title, controller.signal, entity.kind, entity.lookupId);
					if (controller.signal.aborted) {
						return;
					}

					setPage({ ...nextPage, html: sanitizeWikiHtml(nextPage.html, entity.kind) });
					if (entity.kind === "monster") {
						const nextSummary = extractCreatureSummary(nextPage.wikitext);
						const hasSummary = nextSummary.resistances.length > 0 || nextSummary.loot.length > 0;
						if (hasSummary) {
							setCreatureSummary(nextSummary);
						}
					} else if (entity.kind === "item") {
						setItemSummary(extractItemSummary(nextPage.wikitext));
					} else if (entity.kind === "imbuement") {
						setImbuementSummary(extractImbuementSummary(nextPage.wikitext));
					}
				}
			} catch (detailError) {
				if (controller.signal.aborted || (detailError instanceof DOMException && detailError.name === "AbortError")) {
					return;
				}

				setError("Não foi possível carregar os detalhes.");
			}

			if (!controller.signal.aborted) {
				setLoading(false);
			}
		};

		void loadDetails();
	});

	onCleanup(() => {
		return activeController?.abort();
	});

	return (
		<div class={styles.overlay}>
			<section class={styles.panel} role="dialog" aria-modal="true" aria-labelledby="entity-detail-title">
				<header class={styles.panelHeader}>
					<div class={styles.entityHeading}>
						<Show when={entityImageUrl()}>
							{(imageUrl) => {
								return <img class={styles.entityImage} src={imageUrl()} alt="" onError={hideBrokenImage} />;
							}}
						</Show>
						<div>
							<div class={styles.panelKicker}>{ENTITY_KIND_LABEL[props.entity.kind]}</div>
							<h2 id="entity-detail-title" class={styles.panelTitle}>
								{entityTitle()}
							</h2>
						</div>
					</div>
					<button class={styles.closeButton} type="button" aria-label="Fechar detalhes" onClick={props.onClose}>
						×
					</button>
				</header>

				<CustomScrollbar
					variant="nested"
					id="entity-detail-scroll"
					ariaLabel="Rolagem dos detalhes da entidade"
					class={styles.panelBody}
					viewportClass={styles.panelBodyViewport}
				>
					<Show when={loading()}>
						<div class={styles.panelStatus}>Carregando informações...</div>
					</Show>
					<Show when={!loading() && error()}>
						<div class={styles.panelStatus} data-error="true">
							{error()}
						</div>
					</Show>
					<Show when={props.entity.kind === "monster" && !loading() && !error()}>
						<Show
							when={creatureSummary()}
							fallback={<div class={styles.panelStatus}>Não foi possível identificar os dados desta criatura.</div>}
						>
							{(summary) => {
								return <CreatureSummaryView summary={summary()} />;
							}}
						</Show>
					</Show>
					<Show when={props.entity.kind === "item" && !loading() && !error() && page()}>
						<ItemSummaryView summary={itemSummary()} sourceUrl={page()?.sourceUrl} />
					</Show>
					<Show when={props.entity.kind === "imbuement" && !loading() && !error() && page()}>
						<ImbuementSummaryView summary={imbuementSummary()} sourceUrl={page()?.sourceUrl} />
					</Show>
					<Show when={props.entity.kind === "hunt" && !loading() && !error()}>
						<Show
							when={huntDetails()}
							fallback={<div class={styles.panelStatus}>Não foi possível identificar os dados desta hunt.</div>}
						>
							{(details) => {
								return <HuntSummaryView details={details()} />;
							}}
						</Show>
					</Show>
					<Show
						when={
							props.entity.kind !== "monster" &&
							props.entity.kind !== "item" &&
							props.entity.kind !== "imbuement" &&
							props.entity.kind !== "hunt" &&
							!loading() &&
							!error() &&
							page()
						}
					>
						<div class={styles.wikiContent} innerHTML={page()?.html ?? ""} />
					</Show>
				</CustomScrollbar>
			</section>
		</div>
	);
};
