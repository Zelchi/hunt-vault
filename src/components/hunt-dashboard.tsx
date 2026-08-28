import type { Accessor } from "solid-js";
import { createEffect, createMemo, For, onCleanup, onMount, Show } from "solid-js";
import { styled } from "solid-styled-components";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import {
	aggregatePartyMembers,
	calculatePartyHourlyAverages,
	calculatePartySummary,
	countPartyMembers,
	formatNumber,
	formatSignedNumber,
	getAverageValue,
	getBestPartyMember,
	getMemberAverage,
	getMetricValues,
	getPartyMetricValues,
	type MetricConfig,
	parsePartyHunts,
	parseSoloHunts,
	partyChartMetrics,
	soloMetrics,
	summarizeHunts,
} from "@/lib/hunt-dashboard";
import type { DashboardProps } from "@/types/components";

const Page = styled("div")`
	width: 100%;
	max-width: 74rem;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`;

const Section = styled("section")`
	padding: 1.5rem;
	border: 2px solid #2b4638;
	background: #121816;
	box-shadow: 4px 4px 0 #050706;
`;

const SectionHeader = styled("header")`
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.25rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid #1a2b22;

	@media (max-width: 640px) {
		align-items: flex-start;
		flex-direction: column;
	}
`;

const SectionKicker = styled("div")`
	margin-bottom: 0.35rem;
	color: #d9a441;
	font-size: 0.68rem;
	font-weight: 700;
	letter-spacing: 0.14em;
	text-transform: uppercase;
`;

const SectionTitle = styled("h2")`
	margin: 0;
	color: #f4f1ea;
	font-size: 1.25rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

const CountBadge = styled("div")`
	padding: 0.45rem 0.7rem;
	border: 1px solid #526d5b;
	color: #8ba66f;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	white-space: nowrap;
`;

const KpiGrid = styled("div")`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
	gap: 0.75rem;
`;

const Kpi = styled("div")`
	min-height: 5.2rem;
	padding: 0.85rem;
	border: 1px solid #1f3428;
	background: #0d1310;
`;

const KpiLabel = styled("div")`
	margin-bottom: 0.45rem;
	color: #7f9183;
	font-size: 0.68rem;
	font-weight: 700;
	letter-spacing: 0.07em;
	text-transform: uppercase;
`;

const KpiValue = styled("div")`
	color: #f4f1ea;
	font-family: "Courier New", monospace;
	font-size: 1.08rem;
	font-weight: 700;
	line-height: 1.2;
`;

const KpiDetail = styled("div")`
	margin-top: 0.35rem;
	overflow: hidden;
	color: #8b9a8f;
	font-size: 0.68rem;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ChartGrid = styled("div")`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
`;

const ChartCardShell = styled("article")`
	min-width: 0;
	border: 1px solid #1f3428;
	background: #0d1310;
`;

const ChartHeader = styled("header")`
	padding: 0.8rem 0.9rem 0.65rem;
	border-bottom: 1px solid #1a2b22;
`;

const ChartTitle = styled("h3")`
	margin: 0;
	color: #f4f1ea;
	font-size: 0.82rem;
	letter-spacing: 0.05em;
	text-transform: uppercase;
`;

const ChartDescription = styled("p")`
	margin: 0.3rem 0 0;
	color: #708277;
	font-size: 0.7rem;
`;

const ChartSurface = styled("div")`
	position: relative;
	width: 100%;
	height: 248px;
	min-height: 248px;
	padding: 0.35rem;
	overflow: hidden;
	background: #0c100f;
`;

const ChartEmpty = styled("div")`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	color: #607267;
	font-size: 0.75rem;
	text-align: center;
`;

const ChartNote = styled("div")`
	padding: 0.45rem 0.75rem;
	border-top: 1px solid #17271e;
	color: #607267;
	font-size: 0.68rem;
	line-height: 1.4;
`;

const EmptyState = styled("div")`
	margin-top: 1rem;
	padding: 2rem 1rem;
	border: 1px dashed #2b4638;
	background: #0d1310;
	color: #718176;
	font-size: 0.82rem;
	line-height: 1.6;
	text-align: center;
`;

const Ranking = styled("div")`
	margin-top: 1rem;
	border: 1px solid #1f3428;
	background: #0d1310;
	overflow-x: auto;
`;

const RankingTitle = styled("h3")`
	margin: 0;
	padding: 0.9rem;
	border-bottom: 1px solid #1a2b22;
	color: #d9a441;
	font-size: 0.82rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

const Table = styled("table")`
	width: 100%;
	border-collapse: collapse;
	min-width: 600px;

	th,
	td {
	padding: 0.7rem 0.9rem;
	border-bottom: 1px solid #17271e;
	font-size: 0.75rem;
	text-align: right;
	white-space: nowrap;
	}

	th:first-child,
	td:first-child {
	text-align: left;
	}

	th {
	color: #708277;
	font-size: 0.65rem;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	}

	td {
	color: #d8ddd5;
	font-family: "Courier New", monospace;
	}

	tbody tr:last-child td {
	border-bottom: 0;
	}
`;

type MetricChartProps = {
	config: MetricConfig;
	values: Accessor<number[]>;
};

const MetricChart = (props: MetricChartProps) => {
	let chartElement!: HTMLDivElement;
	let chart: uPlot | undefined;
	let resizeObserver: ResizeObserver | undefined;

	const renderChart = () => {
		const values = props.values();
		if (!chartElement || values.length === 0) {
			return;
		}

		const data: uPlot.AlignedData = [values.map((_, index) => index + 1), values];
		const width = Math.max(260, chartElement.clientWidth - 8);

		if (chart) {
			chart.setData(data);
			chart.setSize({ width, height: 230 });
			return;
		}

		chart = new uPlot(
			{
				width,
				height: 230,
				legend: { show: false },
				scales: {
					x: {
						time: false,
						range: () => {
							const count = props.values().length;
							return [0.5, Math.max(1.5, count + 0.5)];
						},
					},
					y: { auto: true },
				},
				series: [
					{},
					{
						label: props.config.title,
						show: true,
						stroke: props.config.color,
						width: 3,
						fill: `${props.config.color}22`,
						spanGaps: true,
						paths: uPlot.paths.linear?.(),
						points: {
							show: true,
							size: values.length === 1 ? 10 : 6,
							stroke: "#0c100f",
							width: 2,
							fill: props.config.color,
						},
					},
				],
				axes: [
					{
						stroke: "#53695a",
						grid: { stroke: "#1a2b22", width: 1 },
						ticks: { stroke: "#2b4638" },
						size: 32,
					},
					{
						stroke: "#53695a",
						grid: { stroke: "#1a2b22", width: 1 },
						ticks: { stroke: "#2b4638" },
						side: 1,
						size: 58,
					},
				],
				cursor: {
					show: true,
					drag: { x: false, y: false },
					focus: { prox: 16 },
					points: { show: true, size: 6, stroke: "#0c100f", width: 2, fill: props.config.color },
				},
			},
			data,
			chartElement,
		);
	};

	createEffect(() => {
		props.values();
		renderChart();
	});

	onMount(() => {
		renderChart();
		resizeObserver = new ResizeObserver(() => {
			if (chart) {
				chart.setSize({ width: Math.max(260, chartElement.clientWidth - 8), height: 230 });
			}
		});
		resizeObserver.observe(chartElement);
	});

	onCleanup(() => {
		resizeObserver?.disconnect();
		chart?.destroy();
	});

	return (
		<ChartCardShell>
			<ChartHeader>
				<ChartTitle>{props.config.title}</ChartTitle>
				<ChartDescription>{props.config.description}</ChartDescription>
			</ChartHeader>
			<ChartSurface ref={chartElement}>
				<Show when={props.values().length === 0}>
					<ChartEmpty>Importe uma caçada válida para visualizar este gráfico.</ChartEmpty>
				</Show>
			</ChartSurface>
			<Show when={props.values().length === 1}>
				<ChartNote>1 caçada registrada: o ponto está centralizado. A linha aparece a partir da segunda caçada.</ChartNote>
			</Show>
		</ChartCardShell>
	);
};

const KpiCard = (props: { label: string; value: string; detail?: string; color?: string }) => {
	return (
		<Kpi>
			<KpiLabel>{props.label}</KpiLabel>
			<KpiValue style={{ color: props.color ?? "#f4f1ea" }}>{props.value}</KpiValue>
			<Show when={props.detail}>
				<KpiDetail>{props.detail}</KpiDetail>
			</Show>
		</Kpi>
	);
};

export default (props: DashboardProps) => {
	const soloHunts = createMemo(() => parseSoloHunts(props.history));
	const partyHunts = createMemo(() => parsePartyHunts(props.history));
	const soloSummary = createMemo(() => summarizeHunts(soloHunts(), soloMetrics));
	const partySummary = createMemo(() => calculatePartySummary(partyHunts()));
	const partyHourlyAverages = createMemo(() => calculatePartyHourlyAverages(partyHunts()));
	const partyMembers = createMemo(() => aggregatePartyMembers(partyHunts()));
	const partyMemberCount = createMemo(() => countPartyMembers(partyHunts()));
	const topDamageMember = createMemo(() => getBestPartyMember(partyMembers(), "damage"));
	const topHealingMember = createMemo(() => getBestPartyMember(partyMembers(), "healing"));
	const bestSuppliesMember = createMemo(() => getBestPartyMember(partyMembers(), "supplies", true));

	return (
		<Page>
			<Show when={props.mode === "solo"}>
				<Section>
					<SectionHeader>
						<div>
							<SectionKicker>Hunt Solo</SectionKicker>
							<SectionTitle>Desempenho individual</SectionTitle>
						</div>
						<CountBadge>{soloSummary().count} caçadas</CountBadge>
					</SectionHeader>

					<KpiGrid>
						<KpiCard label="Caçadas" value={String(soloSummary().count)} />
						<KpiCard label="XP total" value={formatNumber(soloSummary().xp)} color="#d9a441" />
						<KpiCard label="Loot total" value={formatNumber(soloSummary().loot)} color="#8ba66f" />
						<KpiCard label="Supplies" value={formatNumber(soloSummary().supplies)} color="#e0a85d" />
						<KpiCard
							label="Balance"
							value={formatSignedNumber(soloSummary().balance)}
							color={soloSummary().balance >= 0 ? "#8ba66f" : "#e05d5d"}
						/>
						<KpiCard
							label="XP médio"
							value={formatNumber(getAverageValue(soloSummary().xp, soloSummary().count))}
							color="#d9a441"
						/>
					</KpiGrid>

					<Show
						when={soloSummary().count > 0}
						fallback={
							<EmptyState>
								Não há relatórios solo válidos no histórico. Importe um Hunt Analyser para preencher esta seção.
							</EmptyState>
						}
					>
						<ChartGrid>
							<For each={soloMetrics}>
								{(config) => <MetricChart config={config} values={() => getMetricValues(soloHunts(), config)} />}
							</For>
						</ChartGrid>
					</Show>
				</Section>
			</Show>

			<Show when={props.mode === "party"}>
				<Section>
					<SectionHeader>
						<div>
							<SectionKicker>Hunt PT</SectionKicker>
							<SectionTitle>Desempenho em Party Hunt</SectionTitle>
						</div>
						<CountBadge>{partySummary().count} party hunts</CountBadge>
					</SectionHeader>

					<KpiGrid>
						<KpiCard label="Party Hunts" value={String(partySummary().count)} />
						<KpiCard label="Membros" value={String(partyMemberCount())} />
						<KpiCard label="Loot/h médio" value={formatNumber(partyHourlyAverages().loot)} color="#8ba66f" />
						<KpiCard label="Supplies/h médio" value={formatNumber(partyHourlyAverages().supplies)} color="#e0a85d" />
						<KpiCard label="Dano/h médio" value={formatNumber(partyHourlyAverages().damage)} color="#e05d5d" />
						<KpiCard label="Healing/h médio" value={formatNumber(partyHourlyAverages().healing)} color="#a9c38a" />
					</KpiGrid>

					<Show
						when={partySummary().count > 0}
						fallback={
							<EmptyState>
								Não há relatórios de Party Hunt válidos no histórico. Importe uma PT para preencher esta seção.
							</EmptyState>
						}
					>
						<Ranking>
							<RankingTitle>Ranking médio dos membros</RankingTitle>
							<Show
								when={partyMembers().length > 0}
								fallback={<EmptyState>Nenhum membro com métricas individuais foi encontrado.</EmptyState>}
							>
								<Table>
									<thead>
										<tr>
											<th>#</th>
											<th>Jogador</th>
											<th>PTs</th>
											<th>Horas</th>
											<th>Dano/h médio</th>
											<th>Healing/h médio</th>
											<th>Supplies/h médio</th>
											<th>Lucro/h médio</th>
										</tr>
									</thead>
									<tbody>
										<For each={partyMembers()}>
											{(member, index) => (
												<tr>
													<td>{index() + 1}</td>
													<td>{member.name}</td>
													<td>{member.hunts}</td>
													<td>{member.durationHours.toFixed(2)}</td>
													<td>{formatNumber(getMemberAverage(member, "damage"))}</td>
													<td>{formatNumber(getMemberAverage(member, "healing"))}</td>
													<td>{formatNumber(getMemberAverage(member, "supplies"))}</td>
													<td>{formatSignedNumber(getMemberAverage(member, "profit"))}</td>
												</tr>
											)}
										</For>
									</tbody>
								</Table>
							</Show>
						</Ranking>

						<ChartGrid>
							<For each={partyChartMetrics}>
								{(config) => <MetricChart config={config} values={() => getPartyMetricValues(partyHunts(), config)} />}
							</For>
						</ChartGrid>

						<KpiGrid style={{ "margin-top": "1rem" }}>
							<KpiCard
								label="Melhor dano médio"
								value={topDamageMember()?.name ?? "—"}
								detail={topDamageMember() ? formatNumber(getMemberAverage(topDamageMember(), "damage")) : undefined}
								color="#e05d5d"
							/>
							<KpiCard
								label="Melhor healing médio"
								value={topHealingMember()?.name ?? "—"}
								detail={topHealingMember() ? formatNumber(getMemberAverage(topHealingMember(), "healing")) : undefined}
								color="#a9c38a"
							/>
							<KpiCard
								label="Melhor supplies médio"
								value={bestSuppliesMember()?.name ?? "—"}
								detail={bestSuppliesMember() ? formatNumber(getMemberAverage(bestSuppliesMember(), "supplies")) : undefined}
								color="#e0a85d"
							/>
						</KpiGrid>
					</Show>
				</Section>
			</Show>
		</Page>
	);
};
