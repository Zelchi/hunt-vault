import { createMemo, createSignal, For, lazy, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { ChevronLeftIcon, ChevronRightIcon, ScrollIcon } from "@/components/Icons";
import { detectHuntReportType } from "@/lib/hunt-detector";
import { parseHuntPartyReport } from "@/lib/hunt-party";
import { formatCreatedAt, parseHuntSoloReport } from "@/lib/hunt-solo";
import type { HuntViewerProps } from "@/types/components";

const ConfirmModal = lazy(() => import("@/components/ConfirmModal"));

const Card = styled("section")`
	width: 100%;
	max-width: 74rem;
	padding: 2rem;
	border: 2px solid #2b4638;
	border-radius: 0;
	background: #121816;
	box-shadow: 4px 4px 0 #050706;

	@media (max-width: 640px) {
		padding: 1.25rem;
	}
`;

const HuntTabs = styled("div")`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.5rem;
	margin-bottom: 1.5rem;
`;

const HuntTab = styled("button")`
	padding: 0.75rem 1rem;
	border: 2px solid #2b4638;
	border-radius: 0;
	background: #101512;
	color: #a5a8b2;
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	cursor: pointer;

	&[data-active="true"] {
		border-color: #d9a441;
		background: #d9a441;
		box-shadow: 3px 3px 0 #6f4e0d;
		color: #17130c;
	}
`;

const PartyMembers = styled("div")`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

const PartyMemberCard = styled("article")`
	padding: 1rem;
	border: 2px solid #526d5b;
	border-radius: 0;
	background: #18231d;
	box-shadow: 2px 2px 0 #070a09;
`;

const PartyMemberName = styled("h2")`
	margin: 0 0 0.75rem;
	color: #f4f1ea;
	font-size: 0.95rem;
	line-height: 1.35;
`;

const LeaderBadge = styled("span")`
	display: inline-block;
	margin-left: 0.5rem;
	padding: 0.2rem 0.35rem;
	border: 1px solid #d9a441;
	color: #d9a441;
	font-size: 0.65rem;
	letter-spacing: 0.08em;
	vertical-align: middle;
`;

const PartyMetricList = styled("dl")`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.35rem 0.75rem;
	margin: 0;
	font-size: 0.75rem;
`;

const PartyMetricLabel = styled("dt")`
	color: #8e929d;
`;

const PartyMetricValue = styled("dd")`
	margin: 0;
	color: #70e0a0;
	text-align: right;
`;

const PartyRankingGrid = styled("div")`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.75rem;
	margin-bottom: 1.5rem;

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`;

const PartyRanking = styled("section")`
	padding: 1rem;
	border: 2px solid #8c6c26;
	border-radius: 0;
	background: #101512;
	box-shadow: 2px 2px 0 #070a09;
`;

const PartyRankingTitle = styled("h2")`
	margin: 0 0 0.75rem;
	color: #d9a441;
	font-size: 0.8rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

const PartyRankingName = styled("strong")`
	display: block;
	color: #f4f1ea;
	font-size: 0.8rem;
	overflow-wrap: anywhere;
`;

const PartyRankingValue = styled("span")`
	display: block;
	margin-top: 0.25rem;
	color: #70e0a0;
	font-size: 0.9rem;
	font-weight: 700;
`;

const ViewerHeader = styled("div")`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.5rem;

	@media (max-width: 640px) {
		flex-direction: column;
	}
`;

const ViewerTitle = styled("h1")`
	margin: 0;
	color: #e8b84e;
	font-size: clamp(1.5rem, 4vw, 2.25rem);
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

const ViewerCounter = styled("div")`
	padding: 0.5rem 0.75rem;
	border: 2px solid #526d5b;
	border-radius: 0;
	background: #101512;
	box-shadow: 2px 2px 0 #070a09;
	color: #d7d4cc;
	font-size: 0.8rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	white-space: nowrap;
`;

const ViewerActions = styled("div")`
	display: flex;
	align-items: center;
	gap: 0.75rem;

	@media (max-width: 640px) {
		width: 100%;
		justify-content: space-between;
	}
`;

const DeleteButton = styled("button")`
	padding: 0.5rem 0.75rem;
	border: 2px solid #b85a51;
	border-radius: 0;
	background: #2b1514;
	box-shadow: 2px 2px 0 #702c27;
	color: #f08e83;
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background 150ms ease, color 150ms ease, transform 150ms ease;

	&:hover {
		background: #4a1d1b;
		color: #ffc0b9;
		transform: translate(-1px, -1px);
	}
`;

const Carousel = styled("div")`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

const CarouselButton = styled("button")`
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.75rem;
	height: 2.75rem;
	border: 2px solid #d9a441;
	border-radius: 0;
	background: #101512;
	box-shadow: 3px 3px 0 #6f4e0d;
	color: #d9a441;
	font-size: 1.25rem;
	cursor: pointer;
	transition: background 150ms ease, transform 150ms ease;

	&:hover {
		background: #18231d;
		box-shadow: 4px 4px 0 #6f4e0d;
		transform: translate(-1px, -1px);
	}
`;

const CarouselTrack = styled("div")`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;
`;

const SessionBanner = styled("div")`
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(8rem, auto) minmax(10rem, auto);
	gap: 1rem;
	margin-bottom: 1.5rem;
	padding: 1rem 1.25rem;
	border: 2px solid #8c6c26;
	border-radius: 0;
	background: #18231d;
	box-shadow: inset 4px 0 0 #d9a441;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const SessionLabel = styled("span")`
	display: block;
	margin-bottom: 0.35rem;
	color: #a5a8b2;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.08em;
`;

const SessionValue = styled("strong")`
	color: #f4f1ea;
	font-size: 0.95rem;
	line-height: 1.5;
`;

const SessionSaved = styled("div")`
	text-align: right;

	@media (max-width: 640px) {
		text-align: left;
	}
`;

const MetricsGrid = styled("div")`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

const MetricCard = styled("div")`
	min-width: 0;
	padding: 1rem;
	border: 1px solid #2b4638;
	border-radius: 0;
	background: #101512;
	box-shadow: 2px 2px 0 #070a09;
`;

const MetricLabel = styled("span")`
	display: block;
	margin-bottom: 0.5rem;
	color: #8e929d;
	font-size: 0.75rem;
`;

const MetricValue = styled("strong")`
	display: block;
	color: #f4f1ea;
	font-size: 1rem;
	line-height: 1.35;
	overflow-wrap: anywhere;
`;

const ListsGrid = styled("div")`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`;

const DataPanel = styled("section")`
	min-width: 0;
	padding: 1.25rem;
	border: 1px solid #2b4638;
	border-radius: 0;
	background: #101512;
	box-shadow: 2px 2px 0 #070a09;
`;

const PanelHeader = styled("div")`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const PanelTitle = styled("h2")`
	margin: 0;
	font-size: 1rem;
	color: #f4f1ea;
`;

const PanelCount = styled("span")`
	color: #8e929d;
	font-size: 0.75rem;
`;

const ItemList = styled("ul")`
	max-height: 25rem;
	margin: 0;
	padding: 0;
	overflow-y: auto;
	list-style: none;
	scrollbar-color: #63836c #0a0e0c;
	scrollbar-width: thin;
`;

const ItemRow = styled("li")`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.65rem 0;
	border-bottom: 1px solid rgb(255 255 255 / 6%);

	&:last-child {
		border-bottom: 0;
	}
`;

const ItemQuantity = styled("span")`
	flex: 0 0 auto;
	min-width: 3.25rem;
	color: #d9a441;
	font-size: 0.8rem;
	font-weight: 700;
	font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
`;

const ItemName = styled("span")`
	min-width: 0;
	color: #d7d4cc;
	font-size: 0.875rem;
	overflow-wrap: anywhere;
`;

const PanelEmpty = styled("p")`
	margin: 0;
	color: #777b88;
	font-size: 0.875rem;
`;

const RawDetails = styled("details")`
	margin-top: 1rem;
	border: 1px solid #2b4638;
	border-radius: 0;
	background: #101512;

	summary {
	padding: 1rem 1.25rem;
	color: #a5a8b2;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	user-select: none;
	}
`;

const RawText = styled("pre")`
	max-height: 24rem;
	margin: 0;
	padding: 0 1.25rem 1.25rem;
	color: #b9bcc5;
	font: 0.8rem/1.6 ui-monospace, SFMono-Regular, Consolas, monospace;
	white-space: pre-wrap;
	overflow: auto;
	scrollbar-color: #63836c #0a0e0c;
	scrollbar-width: thin;
`;

const EmptyState = styled("div")`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 1.5rem;
	text-align: center;
	color: #777b88;
`;

const EmptyIcon = styled("div")`
	width: 4rem;
	height: 4rem;
	margin-bottom: 1rem;
	border: 2px solid #d9a441;
	border-radius: 0;
	background: #18231d;
	box-shadow: 3px 3px 0 #6f4e0d;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #d9a441;
	font-size: 1.5rem;
`;

const EmptyAction = styled("button")`
	margin-top: 1rem;
	padding: 0.65rem 1rem;
	border: 2px solid #d9a441;
	border-radius: 0;
	background: #101512;
	box-shadow: 3px 3px 0 #6f4e0d;
	color: #d9a441;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background: #18231d;
		transform: translate(-1px, -1px);
	}
`;

const LoadingState = styled("div")`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 18rem;
	color: #777b88;
`;

export default (props: HuntViewerProps) => {
	const [pendingDeleteId, setPendingDeleteId] = createSignal<string | null>(null);
	const [activeCategory, setActiveCategory] = createSignal<"solo" | "party">("solo");
	const [selectedIndex, setSelectedIndex] = createSignal(0);

	const filteredHistory = createMemo(() => {
		const reportType = activeCategory() === "party" ? "party" : "solo";
		return props.history.filter((record) => detectHuntReportType(record.rawText) === reportType);
	});

	const activeHunt = createMemo(() => {
		const records = filteredHistory();
		const index = Math.min(selectedIndex(), Math.max(records.length - 1, 0));
		const record = records[index];

		return record
			? {
					record,
					parsed: parseHuntSoloReport(record.rawText),
				}
			: null;
	});

	const activeParty = createMemo(() => {
		const active = activeHunt();
		return activeCategory() === "party" && active ? parseHuntPartyReport(active.record.rawText) : null;
	});

	const partyRankings = createMemo(() => {
		const party = activeParty();
		if (!party) {
			return null;
		}

		const getTopMember = (label: string) => {
			return (
				party.members
					.map((member) => {
						const metric = member.metrics.find((item) => item.label.toLowerCase() === label);
						const numericValue = metric?.value.replace(/,/g, "").replace(/\./g, "") ?? "0";
						return { member, metric, numericValue: Number(numericValue) };
					})
					.filter((item) => item.metric)
					.sort((a, b) => b.numericValue - a.numericValue)[0] ?? null
			);
		};

		return {
			supplies: getTopMember("supplies"),
			damage: getTopMember("damage"),
			healing: getTopMember("healing"),
		};
	});

	const pendingDelete = createMemo(() => {
		const id = pendingDeleteId();
		return id ? props.history.find((record) => record.id === id) : null;
	});

	const changeCategory = (category: "solo" | "party") => {
		setActiveCategory(category);
		setSelectedIndex(0);
	};

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
			<Card>
				<HuntTabs role="tablist" aria-label="Tipo de caçada">
					<HuntTab data-active={activeCategory() === "solo"} type="button" onClick={() => changeCategory("solo")}>
						Hunt Solo
					</HuntTab>
					<HuntTab data-active={activeCategory() === "party"} type="button" onClick={() => changeCategory("party")}>
						Hunt em Party
					</HuntTab>
				</HuntTabs>
				<Show
					when={!props.loading && filteredHistory().length > 0}
					fallback={
						props.loading ? (
							<LoadingState>Carregando suas caçadas...</LoadingState>
						) : (
							<EmptyState>
								<EmptyIcon>
									<ScrollIcon size={28} />
								</EmptyIcon>
								<strong>Nenhuma caçada salva ainda.</strong>
								<p>Importe o primeiro Hunt Analyser para começar seu histórico.</p>
								<EmptyAction type="button" onClick={props.onImport}>
									Ir para importar
								</EmptyAction>
							</EmptyState>
						)
					}
				>
					<Show when={activeHunt()}>
						{(active) => (
							<>
								<ViewerHeader>
									<div>
										<ViewerTitle>{active().parsed.session || "Caçada sem duração informada"}</ViewerTitle>
									</div>
									<ViewerActions>
										<ViewerCounter>
											{selectedIndex() + 1} de {filteredHistory().length}
										</ViewerCounter>
										<DeleteButton
											type="button"
											onClick={() => requestDelete(active().record.id)}
											aria-label="Excluir esta caçada"
										>
											Excluir
										</DeleteButton>
									</ViewerActions>
								</ViewerHeader>

								<Carousel>
									<CarouselButton type="button" onClick={showPrevious} aria-label="Visualizar caçada anterior">
										<ChevronLeftIcon />
									</CarouselButton>
									<CarouselTrack />
									<CarouselButton type="button" onClick={showNext} aria-label="Visualizar próxima caçada">
										<ChevronRightIcon />
									</CarouselButton>
								</Carousel>

								<SessionBanner>
									<div>
										<SessionLabel>Período da sessão</SessionLabel>
										<SessionValue>{active().parsed.sessionData || "Não informado"}</SessionValue>
									</div>
									<div>
										<SessionLabel>Duração</SessionLabel>
										<SessionValue>{active().parsed.session || "Não informado"}</SessionValue>
									</div>
									<SessionSaved>
										<SessionLabel>Salva em</SessionLabel>
										<SessionValue>{formatCreatedAt(active().record.createdAt)}</SessionValue>
									</SessionSaved>
								</SessionBanner>

								<Show when={activeParty()}>
									{(party) => (
										<PartyMembers aria-label="Participantes da party">
											<For each={party().members}>
												{(member) => (
													<PartyMemberCard>
														<PartyMemberName>
															{member.name}
															<Show when={member.isLeader}>
																<LeaderBadge>LEADER</LeaderBadge>
															</Show>
														</PartyMemberName>
														<PartyMetricList>
															<For each={member.metrics}>
																{(metric) => (
																	<>
																		<PartyMetricLabel>{metric.label}</PartyMetricLabel>
																		<PartyMetricValue>{metric.value}</PartyMetricValue>
																	</>
																)}
															</For>
														</PartyMetricList>
													</PartyMemberCard>
												)}
											</For>
										</PartyMembers>
									)}
								</Show>

								<Show when={partyRankings()}>
									{(rankings) => (
										<PartyRankingGrid aria-label="Destaques da party">
											<PartyRanking>
												<PartyRankingTitle>Top Supplies</PartyRankingTitle>
												<Show when={rankings().supplies} fallback={<PanelEmpty>Sem dados</PanelEmpty>}>
													{(top) => (
														<>
															<PartyRankingName>{top().member.name}</PartyRankingName>
															<PartyRankingValue>{top().metric?.value}</PartyRankingValue>
														</>
													)}
												</Show>
											</PartyRanking>
											<PartyRanking>
												<PartyRankingTitle>Top Damage</PartyRankingTitle>
												<Show when={rankings().damage} fallback={<PanelEmpty>Sem dados</PanelEmpty>}>
													{(top) => (
														<>
															<PartyRankingName>{top().member.name}</PartyRankingName>
															<PartyRankingValue>{top().metric?.value}</PartyRankingValue>
														</>
													)}
												</Show>
											</PartyRanking>
											<PartyRanking>
												<PartyRankingTitle>Top Healing</PartyRankingTitle>
												<Show when={rankings().healing} fallback={<PanelEmpty>Sem dados</PanelEmpty>}>
													{(top) => (
														<>
															<PartyRankingName>{top().member.name}</PartyRankingName>
															<PartyRankingValue>{top().metric?.value}</PartyRankingValue>
														</>
													)}
												</Show>
											</PartyRanking>
										</PartyRankingGrid>
									)}
								</Show>

								<Show when={activeCategory() === "solo"}>
									<MetricsGrid>
										<For each={active().parsed.metrics}>
											{(metric) => (
												<MetricCard>
													<MetricLabel>{metric.label}</MetricLabel>
													<MetricValue>{metric.value}</MetricValue>
												</MetricCard>
											)}
										</For>
									</MetricsGrid>

									<ListsGrid>
										<DataPanel>
											<PanelHeader>
												<PanelTitle>Monstros mortos</PanelTitle>
												<PanelCount>{active().parsed.monsters.length} tipos</PanelCount>
											</PanelHeader>
											<Show
												when={active().parsed.monsters.length > 0}
												fallback={<PanelEmpty>Nenhum monstro encontrado.</PanelEmpty>}
											>
												<ItemList>
													<For each={active().parsed.monsters}>
														{(item) => (
															<ItemRow>
																<ItemQuantity>{item.quantity}x</ItemQuantity>
																<ItemName>{item.name}</ItemName>
															</ItemRow>
														)}
													</For>
												</ItemList>
											</Show>
										</DataPanel>

										<DataPanel>
											<PanelHeader>
												<PanelTitle>Itens coletados</PanelTitle>
												<PanelCount>{active().parsed.lootedItems.length} tipos</PanelCount>
											</PanelHeader>
											<Show
												when={active().parsed.lootedItems.length > 0}
												fallback={<PanelEmpty>Nenhum item encontrado.</PanelEmpty>}
											>
												<ItemList>
													<For each={active().parsed.lootedItems}>
														{(item) => (
															<ItemRow>
																<ItemQuantity>{item.quantity}x</ItemQuantity>
																<ItemName>{item.name}</ItemName>
															</ItemRow>
														)}
													</For>
												</ItemList>
											</Show>
										</DataPanel>
									</ListsGrid>

									<RawDetails>
										<summary>Ver texto original da caçada</summary>
										<RawText>{active().record.rawText}</RawText>
									</RawDetails>
								</Show>
							</>
						)}
					</Show>
				</Show>
			</Card>
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
