import type { Accessor } from "solid-js";
import { createEffect, createMemo, For, onCleanup, onMount, Show } from "solid-js";
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
import * as styles from "@/styles/hunt-dashboard.css";
import type { DashboardProps } from "@/types/components";

type MetricChartProps = {
	config: MetricConfig;
	values: Accessor<number[]>;
};

type KpiColor = "gold" | "green" | "orange" | "red" | "lightGreen";

type KpiCardProps = {
	label: string;
	value: string;
	detail?: string;
	color?: KpiColor;
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
		<article class={styles.chartCardShell}>
			<header class={styles.chartHeader}>
				<h3 class={styles.chartTitle}>{props.config.title}</h3>
				<p class={styles.chartDescription}>{props.config.description}</p>
			</header>
			<div class={styles.chartSurface} ref={chartElement}>
				<Show when={props.values().length === 0}>
					<div class={styles.chartEmpty}>Importe uma caçada válida para visualizar este gráfico.</div>
				</Show>
			</div>
			<Show when={props.values().length === 1}>
				<div class={styles.chartNote}>
					1 caçada registrada: o ponto está centralizado. A linha aparece a partir da segunda caçada.
				</div>
			</Show>
		</article>
	);
};

const KpiCard = (props: KpiCardProps) => {
	const colorClass = {
		gold: styles.kpiValueGold,
		green: styles.kpiValueGreen,
		orange: styles.kpiValueOrange,
		red: styles.kpiValueRed,
		lightGreen: styles.kpiValueLightGreen,
	} as const;

	return (
		<div class={styles.kpi}>
			<div class={styles.kpiLabel}>{props.label}</div>
			<div class={`${styles.kpiValue}${props.color ? ` ${colorClass[props.color]}` : ""}`}>{props.value}</div>
			<Show when={props.detail}>
				<div class={styles.kpiDetail}>{props.detail}</div>
			</Show>
		</div>
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
		<div class={styles.page}>
			<Show when={props.mode === "solo"}>
				<section class={styles.section}>
					<header class={styles.sectionHeader}>
						<div>
							<div class={styles.sectionKicker}>Hunt Solo</div>
							<h2 class={styles.sectionTitle}>Desempenho individual</h2>
						</div>
						<div class={styles.countBadge}>{soloSummary().count} caçadas</div>
					</header>

					<div class={styles.kpiGrid}>
						<KpiCard label="Caçadas" value={String(soloSummary().count)} />
						<KpiCard label="XP total" value={formatNumber(soloSummary().xp)} color="gold" />
						<KpiCard label="Loot total" value={formatNumber(soloSummary().loot)} color="green" />
						<KpiCard label="Supplies" value={formatNumber(soloSummary().supplies)} color="orange" />
						<KpiCard
							label="Balance"
							value={formatSignedNumber(soloSummary().balance)}
							color={soloSummary().balance >= 0 ? "green" : "red"}
						/>
						<KpiCard
							label="XP médio"
							value={formatNumber(getAverageValue(soloSummary().xp, soloSummary().count))}
							color="gold"
						/>
					</div>

					<Show
						when={soloSummary().count > 0}
						fallback={
							<div class={styles.emptyState}>
								Não há relatórios solo válidos no histórico. Importe um Hunt Analyser para preencher esta seção.
							</div>
						}
					>
						<div class={styles.chartGrid}>
							<For each={soloMetrics}>
								{(config) => <MetricChart config={config} values={() => getMetricValues(soloHunts(), config)} />}
							</For>
						</div>
					</Show>
				</section>
			</Show>

			<Show when={props.mode === "party"}>
				<section class={styles.section}>
					<header class={styles.sectionHeader}>
						<div>
							<div class={styles.sectionKicker}>Hunt PT</div>
							<h2 class={styles.sectionTitle}>Desempenho em Party Hunt</h2>
						</div>
						<div class={styles.countBadge}>{partySummary().count} party hunts</div>
					</header>



					<div class={styles.kpiGrid}>
						<KpiCard label="Party Hunts" value={String(partySummary().count)} />
						<KpiCard label="Membros" value={String(partyMemberCount())} />
						<KpiCard label="Loot/h médio" value={formatNumber(partyHourlyAverages().loot)} color="green" />
						<KpiCard label="Supplies/h médio" value={formatNumber(partyHourlyAverages().supplies)} color="orange" />
						<KpiCard label="Dano/h médio" value={formatNumber(partyHourlyAverages().damage)} color="red" />
						<KpiCard label="Healing/h médio" value={formatNumber(partyHourlyAverages().healing)} color="lightGreen" />
					</div>
					<div class={`${styles.kpiGrid} ${styles.spacedKpiGrid}`}>
						<KpiCard
							label="Melhor dano médio"
							value={topDamageMember()?.name ?? "—"}
							detail={topDamageMember() ? formatNumber(getMemberAverage(topDamageMember(), "damage")) : undefined}
							color="red"
						/>
						<KpiCard
							label="Melhor healing médio"
							value={topHealingMember()?.name ?? "—"}
							detail={topHealingMember() ? formatNumber(getMemberAverage(topHealingMember(), "healing")) : undefined}
							color="lightGreen"
						/>
						<KpiCard
							label="Melhor supplies médio"
							value={bestSuppliesMember()?.name ?? "—"}
							detail={bestSuppliesMember() ? formatNumber(getMemberAverage(bestSuppliesMember(), "supplies")) : undefined}
							color="orange"
						/>
					</div>
					<Show
						when={partySummary().count > 0}
						fallback={
							<div class={styles.emptyState}>
								Não há relatórios de Party Hunt válidos no histórico. Importe uma PT para preencher esta seção.
							</div>
						}
					>
						<div class={styles.ranking}>
							<h3 class={styles.rankingTitle}>Ranking médio dos membros</h3>
							<Show
								when={partyMembers().length > 0}
								fallback={<div class={styles.emptyState}>Nenhum membro com métricas individuais foi encontrado.</div>}
							>
								<table class={styles.table}>
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
								</table>
							</Show>
						</div>

						<div class={styles.chartGrid}>
							<For each={partyChartMetrics}>
								{(config) => <MetricChart config={config} values={() => getPartyMetricValues(partyHunts(), config)} />}
							</For>
						</div>
					</Show>
				</section>
			</Show>
		</div>
	);
};
