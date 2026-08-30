import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";

import CustomScrollbar from "@/components/custom-scrollbar";
import {
	type CreatureFallbackDetails,
	type CreatureSummary,
	extractCreatureSummary,
	fetchCreatureFallback,
	fetchWikiDetails,
	sanitizeWikiHtml,
	type WikiPageDetails,
} from "@/lib/entity-details";
import type { EntitySearchResult } from "@/lib/entity-search";
import * as styles from "@/styles/entity-detail-panel.css";

type EntityDetailPanelProps = {
	entity: EntitySearchResult;
	onClose: () => void;
};

const entityKindLabel: Record<EntitySearchResult["kind"], string> = {
	monster: "Monstro",
	spell: "Habilidade",
	rune: "Runa",
};

const resistanceKindLabel: Record<CreatureSummary["resistances"][number]["kind"], string> = {
	immune: "Imune",
	strong: "Resistente",
	neutral: "Neutro",
	weak: "Vulnerável",
	healed: "Cura",
};

type CreatureResistance = CreatureSummary["resistances"][number];

const resistanceGroups = (resistances: CreatureResistance[]) => [
	{
		label: "Bons para atacar",
		items: resistances.filter((resistance) => resistance.kind === "weak"),
	},
	{
		label: "Ruins para atacar",
		items: resistances.filter((resistance) => ["immune", "strong", "healed"].includes(resistance.kind)),
	},
	{
		label: "Neutros",
		items: resistances.filter((resistance) => resistance.kind === "neutral"),
	},
];

const CreatureSummaryView = (props: { summary: CreatureSummary }) => (
	<div class={styles.creatureSummary}>
		<section class={styles.summarySection}>
			<h3 class={styles.summaryTitle}>Resistências</h3>
			<Show when={props.summary.resistances.length > 0} fallback={<p class={styles.summaryEmpty}>Nenhuma resistência informada.</p>}>
				<For each={resistanceGroups(props.summary.resistances)}>
					{(group) => (
						<Show when={group.items.length > 0}>
							<div class={styles.resistanceGroup}>
								<h4 class={styles.resistanceGroupTitle}>{group.label}</h4>
								<div class={styles.resistanceGrid}>
									<For each={group.items}>
										{(resistance) => (
											<div class={styles.resistanceItem} data-type={resistance.kind}>
												<span class={styles.resistanceLabel}>
													<Show when={resistance.iconUrl}>
														<img class={styles.resistanceIcon} src={resistance.iconUrl} alt="" loading="lazy" />
													</Show>
													{resistance.label}
												</span>
												<strong>{resistance.value}</strong>
												<small>{resistanceKindLabel[resistance.kind]}</small>
											</div>
										)}
									</For>
								</div>
							</div>
						</Show>
					)}
				</For>
			</Show>
		</section>

		<section class={styles.summarySection}>
			<h3 class={styles.summaryTitle}>Loot</h3>
			<Show when={props.summary.loot.length > 0} fallback={<p class={styles.summaryEmpty}>Nenhum loot informado.</p>}>
				<ul class={styles.lootList}>
					<For each={props.summary.loot}>{(item) => <li>{item}</li>}</For>
				</ul>
			</Show>
		</section>
	</div>
);

export default (props: EntityDetailPanelProps) => {
	const [page, setPage] = createSignal<WikiPageDetails>();
	const [creatureSummary, setCreatureSummary] = createSignal<CreatureSummary>();
	const [creatureFallback, setCreatureFallback] = createSignal<CreatureFallbackDetails>();
	const [, setUsingFallback] = createSignal(false);
	const [loading, setLoading] = createSignal(true);
	const [error, setError] = createSignal("");
	let activeController: AbortController | undefined;

	createEffect(() => {
		const title = props.entity.title;
		activeController?.abort();
		const controller = new AbortController();
		activeController = controller;
		setPage(undefined);
		setCreatureSummary(undefined);
		setCreatureFallback(undefined);
		setUsingFallback(false);
		setError("");
		setLoading(true);

		const loadCreatureFallback = async () => {
			if (!props.entity.lookupId) {
				throw new Error("O monstro não possui identificador TibiaData.");
			}

			const fallback = await fetchCreatureFallback(props.entity.lookupId, controller.signal);
			if (!controller.signal.aborted) {
				setPage(undefined);
				setCreatureFallback(fallback);
				setCreatureSummary(fallback.summary);
				setUsingFallback(true);
			}
		};

		const loadDetails = async () => {
			try {
				const nextPage = await fetchWikiDetails(title, controller.signal, props.entity.kind, props.entity.lookupId);
				if (controller.signal.aborted) {
					return;
				}

				setPage({ ...nextPage, html: sanitizeWikiHtml(nextPage.html) });
				if (props.entity.kind === "monster") {
					const nextSummary = extractCreatureSummary(nextPage.wikitext);
					const hasSummary = nextSummary.resistances.length > 0 || nextSummary.loot.length > 0;
					if (hasSummary) {
						setCreatureSummary(nextSummary);
					}
				}
			} catch (detailError) {
				if (controller.signal.aborted || (detailError instanceof DOMException && detailError.name === "AbortError")) {
					return;
				}

				if (props.entity.kind !== "monster") {
					setError("Não foi possível carregar os detalhes da TibiaWiki.");
				}
			}

			if (props.entity.kind === "monster" && !creatureSummary()) {
				try {
					await loadCreatureFallback();
				} catch (fallbackError) {
					if (!controller.signal.aborted && !(fallbackError instanceof DOMException && fallbackError.name === "AbortError")) {
						setError("Não foi possível carregar os detalhes da criatura.");
					}
				}
			}

			if (!controller.signal.aborted) {
				setLoading(false);
			}
		};

		void loadDetails();
	});

	onCleanup(() => activeController?.abort());

	return (
		<div class={styles.overlay}>
			<section class={styles.panel} role="dialog" aria-modal="true" aria-labelledby="entity-detail-title">
				<header class={styles.panelHeader}>
					<div class={styles.entityHeading}>
						<Show when={props.entity.imageUrl}>
							<img class={styles.entityImage} src={props.entity.imageUrl} alt="" />
						</Show>
						<div>
							<div class={styles.panelKicker}>{entityKindLabel[props.entity.kind]}</div>
							<h2 id="entity-detail-title" class={styles.panelTitle}>
								{page()?.title ?? creatureFallback()?.title ?? props.entity.title}
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
						<div class={styles.panelStatus}>Carregando informações da TibiaWiki...</div>
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
							{(summary) => <CreatureSummaryView summary={summary()} />}
						</Show>
					</Show>
					<Show when={props.entity.kind !== "monster" && !loading() && !error() && page()}>
						<div class={styles.wikiContent} innerHTML={page()?.html ?? ""} />
					</Show>
				</CustomScrollbar>
			</section>
		</div>
	);
};
