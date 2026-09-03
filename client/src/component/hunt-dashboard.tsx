import { createEffect, createMemo, For, onCleanup, onMount, Show } from "solid-js";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import CustomScrollbar from "@/component/custom-scrollbar";
import * as dashboard from "@/lib/hunt-dashboard";
import * as styles from "@/style/hunt-dashboard.css";
import type { DashboardProps, KpiCardProps, MetricChartProps } from "@/type/components";

const MetricChart = (props: MetricChartProps) => {
	let chartElement!: HTMLDivElement;
	let chart: uPlot | undefined;
	let resizeObserver: ResizeObserver | undefined;

	const renderChart = () => {
		const values = props.values();
		if (!chartElement || values.length === 0) {
			return;
		}

		const data: uPlot.AlignedData = [
			values.map((_, index) => {
				return index + 1;
			}),
			values,
		];
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
		</article>
	);
};

const KpiCard = (props: KpiCardProps) => {
	const colorClass = {
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
	const partyHunts = createMemo(() => {
		return dashboard.parsePartyHunts(props.history);
	});
	const partySummary = createMemo(() => {
		return dashboard.calculatePartySummary(partyHunts());
	});
	const partyHourlyAverages = createMemo(() => {
		return dashboard.calculatePartyHourlyAverages(partyHunts());
	});
	const partyMembers = createMemo(() => {
		return dashboard.aggregatePartyMembers(partyHunts());
	});
	const partyMemberCount = createMemo(() => {
		return dashboard.countPartyMembers(partyHunts());
	});
	const topDamageMember = createMemo(() => {
		return dashboard.getBestPartyMember(partyMembers(), "damage");
	});
	const topHealingMember = createMemo(() => {
		return dashboard.getBestPartyMember(partyMembers(), "healing");
	});
	const bestSuppliesMember = createMemo(() => {
		return dashboard.getBestPartyMember(partyMembers(), "supplies", true);
	});

	return (
		<div class={styles.page}>
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
					<KpiCard label="Loot/h médio" value={dashboard.formatNumber(partyHourlyAverages().loot)} color="green" />
					<KpiCard label="Supplies/h médio" value={dashboard.formatNumber(partyHourlyAverages().supplies)} color="orange" />
					<KpiCard label="Dano/h médio" value={dashboard.formatNumber(partyHourlyAverages().damage)} color="red" />
					<KpiCard label="Healing/h médio" value={dashboard.formatNumber(partyHourlyAverages().healing)} color="lightGreen" />
				</div>
				<div class={`${styles.kpiGrid} ${styles.spacedKpiGrid}`}>
					<KpiCard
						label="Maior dano médio"
						value={topDamageMember()?.name ?? "—"}
						detail={
							topDamageMember() ? dashboard.formatNumber(dashboard.getMemberAverage(topDamageMember(), "damage")) : undefined
						}
						color="red"
					/>
					<KpiCard
						label="Maior healing médio"
						value={topHealingMember()?.name ?? "—"}
						detail={
							topHealingMember()
								? dashboard.formatNumber(dashboard.getMemberAverage(topHealingMember(), "healing"))
								: undefined
						}
						color="lightGreen"
					/>
					<KpiCard
						label="Menor supplies médio"
						value={bestSuppliesMember()?.name ?? "—"}
						detail={
							bestSuppliesMember()
								? dashboard.formatNumber(dashboard.getMemberAverage(bestSuppliesMember(), "supplies"))
								: undefined
						}
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
							<CustomScrollbar
								variant="nested"
								orientation="horizontal"
								id="party-ranking-scroll"
								ariaLabel="Rolagem horizontal do ranking"
								class={styles.rankingScroller}
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
											{(member, index) => {
												return (
													<tr>
														<td>{index() + 1}</td>
														<td>{member.name}</td>
														<td>{member.hunts}</td>
														<td>{member.durationHours.toFixed(2)}</td>
														<td>{dashboard.formatNumber(dashboard.getMemberAverage(member, "damage"))}</td>
														<td>{dashboard.formatNumber(dashboard.getMemberAverage(member, "healing"))}</td>
														<td>{dashboard.formatNumber(dashboard.getMemberAverage(member, "supplies"))}</td>
														<td>
															{dashboard.formatSignedNumber(dashboard.getMemberAverage(member, "profit"))}
														</td>
													</tr>
												);
											}}
										</For>
									</tbody>
								</table>
							</CustomScrollbar>
						</Show>
					</div>

					<div class={styles.chartGrid}>
						<For each={dashboard.partyChartMetrics}>
							{(config) => {
								return (
									<MetricChart
										config={config}
										values={() => {
											return dashboard.getPartyHourlyValues(partyHunts(), config);
										}}
									/>
								);
							}}
						</For>
					</div>
				</Show>
			</section>
		</div>
	);
};
