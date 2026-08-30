import { createMemo, createSignal, For, lazy, Show } from "solid-js";
import { ChevronLeftIcon, ChevronRightIcon, ScrollIcon } from "@/components/icons";
import * as dashboard from "@/lib/hunt-dashboard";
import { detectHuntReportType } from "@/lib/hunt-detector";
import { parseHuntPartyReport } from "@/lib/hunt-party";
import * as styles from "@/styles/hunt-viewer.css";
import type { HuntViewerProps } from "@/types/components";

const ConfirmModal = lazy(() => import("@/components/confirm-modal"));

const formatCreatedAt = (createdAt: string) => {
	return new Date(createdAt).toLocaleString("pt-BR", {
		dateStyle: "medium",
		timeStyle: "short",
	});
};

export default (props: HuntViewerProps) => {
	const [pendingDeleteId, setPendingDeleteId] = createSignal<string | null>(null);
	const [selectedIndex, setSelectedIndex] = createSignal(0);

	const filteredHistory = createMemo(() => {
		return props.history.filter((record) => detectHuntReportType(record.rawText) === "party");
	});

	const activeHunt = createMemo(() => {
		const records = filteredHistory();
		const index = Math.min(selectedIndex(), Math.max(records.length - 1, 0));
		const record = records[index];

		return record
			? {
					record,
					parsed: parseHuntPartyReport(record.rawText),
				}
			: null;
	});

	const activeParty = createMemo(() => activeHunt()?.parsed ?? null);

	const partyRankings = createMemo(() => dashboard.getPartyRankings(activeParty()));

	const pendingDelete = createMemo(() => {
		const id = pendingDeleteId();
		return id ? props.history.find((record) => record.id === id) : null;
	});

	const showPrevious = () => {
		setSelectedIndex((index) => {
			const length = filteredHistory().length;
			return length === 0 ? 0 : (index - 1 + length) % length;
		});
	};

	const showNext = () => {
		setSelectedIndex((index) => {
			const length = filteredHistory().length;
			return length === 0 ? 0 : (index + 1) % length;
		});
	};

	const requestDelete = (id: string) => {
		setPendingDeleteId(id);
	};

	const cancelDelete = () => {
		if (!props.deleting) {
			setPendingDeleteId(null);
		}
	};

	const confirmDelete = () => {
		const id = pendingDeleteId();
		if (id) {
			props.onDelete(id);
		}
	};

	return (
		<>
			<section class={styles.card}>
				<Show
					when={!props.loading && filteredHistory().length > 0}
					fallback={
						props.loading ? (
							<div class={styles.loadingState}>Carregando suas caçadas...</div>
						) : (
							<div class={styles.emptyState}>
								<div class={styles.emptyIcon}>
									<ScrollIcon size={28} />
								</div>
								<strong>Nenhuma caçada salva ainda.</strong>
								<p>Importe o primeiro Hunt Analyser para começar seu histórico.</p>
								<button class={styles.emptyAction} type="button" onClick={props.onImport}>
									Ir para importar
								</button>
							</div>
						)
					}
				>
					<Show when={activeHunt()}>
						{(active) => (
							<>
								<div class={styles.viewerHeader}>
									<div>
										<h1 class={styles.viewerTitle}>{active().parsed.session || "Caçada sem duração informada"}</h1>
									</div>
									<div class={styles.viewerActions}>
										<div class={styles.viewerCounter}>
											{selectedIndex() + 1} de {filteredHistory().length}
										</div>
										<button
											class={styles.deleteButton}
											type="button"
											onClick={() => requestDelete(active().record.id)}
											aria-label="Excluir esta caçada"
										>
											Excluir
										</button>
									</div>
								</div>

								<div class={styles.carousel}>
									<button
										class={styles.carouselButton}
										type="button"
										onClick={showPrevious}
										aria-label="Visualizar caçada anterior"
									>
										<ChevronLeftIcon />
									</button>
									<div class={styles.carouselTrack}>
										<span class={styles.carouselHint}>Use as setas para navegar entre as caçadas salvas.</span>
									</div>
									<button
										class={styles.carouselButton}
										type="button"
										onClick={showNext}
										aria-label="Visualizar próxima caçada"
									>
										<ChevronRightIcon />
									</button>
								</div>

								<div class={styles.sessionBanner}>
									<div>
										<span class={styles.sessionLabel}>Período da sessão</span>
										<strong class={styles.sessionValue}>{active().parsed.sessionData || "Não informado"}</strong>
									</div>
									<div>
										<span class={styles.sessionLabel}>Duração</span>
										<strong class={styles.sessionValue}>{active().parsed.session || "Não informado"}</strong>
									</div>
									<div class={styles.sessionSaved}>
										<span class={styles.sessionLabel}>Salva em</span>
										<strong class={styles.sessionValue}>{formatCreatedAt(active().record.createdAt)}</strong>
									</div>
								</div>

								<Show when={activeParty()}>
									{(party) => (
										<section class={styles.partyMembers} aria-label="Participantes da party">
											<For each={party().members}>
												{(member) => (
													<article class={styles.partyMemberCard}>
														<h2 class={styles.partyMemberName}>
															{member.name}
															<Show when={member.isLeader}>
																<span class={styles.leaderBadge}>LEADER</span>
															</Show>
														</h2>
														<dl class={styles.partyMetricList}>
															<For each={member.metrics}>
																{(metric) => (
																	<>
																		<dt class={styles.partyMetricLabel}>{metric.label}</dt>
																		<dd class={styles.partyMetricValue}>{metric.value}</dd>
																	</>
																)}
															</For>
														</dl>
													</article>
												)}
											</For>
										</section>
									)}
								</Show>

								<Show when={partyRankings()}>
									{(rankings) => (
										<section class={styles.partyRankingGrid} aria-label="Destaques da party">
											<section class={styles.partyRanking}>
												<h2 class={styles.partyRankingTitle}>Top Supplies</h2>
												<Show when={rankings().supplies} fallback={<p class={styles.panelEmpty}>Sem dados</p>}>
													{(top) => (
														<>
															<strong class={styles.partyRankingName}>{top().member.name}</strong>
															<span class={styles.partyRankingValue}>{top().metric?.value}</span>
														</>
													)}
												</Show>
											</section>
											<section class={styles.partyRanking}>
												<h2 class={styles.partyRankingTitle}>Top Damage</h2>
												<Show when={rankings().damage} fallback={<p class={styles.panelEmpty}>Sem dados</p>}>
													{(top) => (
														<>
															<strong class={styles.partyRankingName}>{top().member.name}</strong>
															<span class={styles.partyRankingValue}>{top().metric?.value}</span>
														</>
													)}
												</Show>
											</section>
											<section class={styles.partyRanking}>
												<h2 class={styles.partyRankingTitle}>Top Healing</h2>
												<Show when={rankings().healing} fallback={<p class={styles.panelEmpty}>Sem dados</p>}>
													{(top) => (
														<>
															<strong class={styles.partyRankingName}>{top().member.name}</strong>
															<span class={styles.partyRankingValue}>{top().metric?.value}</span>
														</>
													)}
												</Show>
											</section>
										</section>
									)}
								</Show>

								<details class={styles.rawDetails}>
									<summary>Ver texto original da caçada</summary>
									<pre class={styles.rawText}>{active().record.rawText}</pre>
								</details>
							</>
						)}
					</Show>
				</Show>
			</section>
			<ConfirmModal
				open={Boolean(pendingDelete())}
				confirming={props.deleting}
				title="Excluir caçada?"
				message=""
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
			/>
		</>
	);
};
