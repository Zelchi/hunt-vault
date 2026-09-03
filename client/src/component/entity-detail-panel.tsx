import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";

import CustomScrollbar from "@/component/custom-scrollbar";
import { ENTITY_KIND_LABEL } from "@/const/entity";
import {
	type CreatureSummary,
	extractCreatureSummary,
	extractImbuementSummary,
	extractItemSummary,
	fetchWikiDetails,
	type ImbuementSummary,
	type ItemSummary,
	sanitizeWikiHtml,
	type WikiPageDetails,
} from "@/lib/entity-details";
import type { EntitySearchResult } from "@/lib/entity-search";
import * as styles from "@/style/entity-detail-panel.css";

type EntityDetailPanelProps = {
	entity: EntitySearchResult;
	onClose: () => void;
};

const hideBrokenImage = (event: Event) => {
	(event.currentTarget as HTMLImageElement).hidden = true;
};

const resistanceKindLabel: Record<CreatureSummary["resistances"][number]["kind"], string> = {
	immune: "Imune",
	strong: "Resistente",
	neutral: "Neutro",
	weak: "Vulnerável",
	healed: "Cura",
};

type CreatureResistance = CreatureSummary["resistances"][number];

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

const CreatureSummaryView = (props: { summary: CreatureSummary }) => {
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
															<small>{resistanceKindLabel[resistance.kind]}</small>
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

const ItemSummaryView = (props: { summary?: ItemSummary; sourceUrl?: string }) => {
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

const ImbuementSummaryView = (props: { summary?: ImbuementSummary; sourceUrl?: string }) => {
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

export default (props: EntityDetailPanelProps) => {
	const [page, setPage] = createSignal<WikiPageDetails>();
	const [creatureSummary, setCreatureSummary] = createSignal<CreatureSummary>();
	const [itemSummary, setItemSummary] = createSignal<ItemSummary>();
	const [imbuementSummary, setImbuementSummary] = createSignal<ImbuementSummary>();
	const [loading, setLoading] = createSignal(true);
	const [error, setError] = createSignal("");
	let activeController: AbortController | undefined;
	const entityImageUrl = () => {
		return page()?.imageUrl ?? props.entity.imageUrl;
	};

	createEffect(() => {
		const title = props.entity.title;
		activeController?.abort();
		const controller = new AbortController();
		activeController = controller;
		setPage(undefined);
		setCreatureSummary(undefined);
		setItemSummary(undefined);
		setImbuementSummary(undefined);
		setError("");
		setLoading(true);

		const loadDetails = async () => {
			try {
				const nextPage = await fetchWikiDetails(title, controller.signal, props.entity.kind, props.entity.lookupId);
				if (controller.signal.aborted) {
					return;
				}

				setPage({ ...nextPage, html: sanitizeWikiHtml(nextPage.html, props.entity.kind) });
				if (props.entity.kind === "monster") {
					const nextSummary = extractCreatureSummary(nextPage.wikitext);
					const hasSummary = nextSummary.resistances.length > 0 || nextSummary.loot.length > 0;
					if (hasSummary) {
						setCreatureSummary(nextSummary);
					}
				} else if (props.entity.kind === "item") {
					setItemSummary(extractItemSummary(nextPage.wikitext));
				} else if (props.entity.kind === "imbuement") {
					setImbuementSummary(extractImbuementSummary(nextPage.wikitext));
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
								return <img class={styles.entityImage} src={imageUrl()} alt="" />;
							}}
						</Show>
						<div>
							<div class={styles.panelKicker}>{ENTITY_KIND_LABEL[props.entity.kind]}</div>
							<h2 id="entity-detail-title" class={styles.panelTitle}>
								{page()?.title ?? props.entity.title}
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
					<Show
						when={
							props.entity.kind !== "monster" &&
							props.entity.kind !== "item" &&
							props.entity.kind !== "imbuement" &&
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
