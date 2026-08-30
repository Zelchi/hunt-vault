import { globalStyle, style } from "@vanilla-extract/css";

export const page = style({
	width: "100%",
	maxWidth: "74rem",
	display: "flex",
	flexDirection: "column",
	gap: "1.5rem",
});

export const section = style({
	padding: "1.5rem",
	border: "2px solid #2b4638",
	background: "#121816",
	boxShadow: "4px 4px 0 #050706",
});

export const sectionHeader = style({
	display: "flex",
	alignItems: "flex-end",
	justifyContent: "space-between",
	gap: "1rem",
	marginBottom: "1.25rem",
	paddingBottom: "1rem",
	borderBottom: "2px solid #1a2b22",
	"@media": {
		"screen and (max-width: 640px)": {
			alignItems: "flex-start",
			flexDirection: "column",
		},
	},
});

export const sectionKicker = style({
	marginBottom: "0.35rem",
	color: "#d9a441",
	fontSize: "0.68rem",
	fontWeight: 700,
	letterSpacing: "0.14em",
	textTransform: "uppercase",
});

export const sectionTitle = style({
	margin: 0,
	color: "#f4f1ea",
	fontSize: "1.25rem",
	letterSpacing: "0.08em",
	textTransform: "uppercase",
});

export const countBadge = style({
	padding: "0.45rem 0.7rem",
	border: "1px solid #526d5b",
	color: "#8ba66f",
	fontSize: "0.72rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
	whiteSpace: "nowrap",
});

export const kpiGrid = style({
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
	gap: "0.75rem",
});

export const kpi = style({
	minHeight: "5.2rem",
	padding: "0.85rem",
	border: "1px solid #1f3428",
	background: "#0d1310",
});

export const kpiLabel = style({
	marginBottom: "0.45rem",
	color: "#7f9183",
	fontSize: "0.68rem",
	fontWeight: 700,
	letterSpacing: "0.07em",
	textTransform: "uppercase",
});

export const kpiValue = style({
	color: "#f4f1ea",
	fontFamily: "Courier New, monospace",
	fontSize: "1.08rem",
	fontWeight: 700,
	lineHeight: 1.2,
});

export const kpiValueGreen = style({ color: "#8ba66f" });
export const kpiValueOrange = style({ color: "#e0a85d" });
export const kpiValueRed = style({ color: "#e05d5d" });
export const kpiValueLightGreen = style({ color: "#a9c38a" });

export const kpiDetail = style({
	marginTop: "0.35rem",
	overflow: "hidden",
	color: "#8b9a8f",
	fontSize: "0.68rem",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
});

export const chartGrid = style({
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
	gap: "1rem",
	marginTop: "1rem",
});

export const spacedKpiGrid = style({
	marginTop: "1rem",
});

export const chartCardShell = style({
	minWidth: 0,
	border: "1px solid #1f3428",
	background: "#0d1310",
});

export const chartHeader = style({
	padding: "0.8rem 0.9rem 0.65rem",
	borderBottom: "1px solid #1a2b22",
});

export const chartTitle = style({
	margin: 0,
	color: "#f4f1ea",
	fontSize: "0.82rem",
	letterSpacing: "0.05em",
	textTransform: "uppercase",
});

export const chartDescription = style({
	margin: "0.3rem 0 0",
	color: "#708277",
	fontSize: "0.7rem",
});

export const chartSurface = style({
	position: "relative",
	width: "100%",
	height: "248px",
	minHeight: "248px",
	padding: "0.35rem",
	overflow: "hidden",
	background: "#0c100f",
});

export const chartEmpty = style({
	position: "absolute",
	inset: 0,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: "1rem",
	color: "#607267",
	fontSize: "0.75rem",
	textAlign: "center",
});

export const chartNote = style({
	padding: "0.45rem 0.75rem",
	borderTop: "1px solid #17271e",
	color: "#607267",
	fontSize: "0.68rem",
	lineHeight: 1.4,
});

export const emptyState = style({
	marginTop: "1rem",
	padding: "2rem 1rem",
	border: "1px dashed #2b4638",
	background: "#0d1310",
	color: "#718176",
	fontSize: "0.82rem",
	lineHeight: 1.6,
	textAlign: "center",
});

export const ranking = style({
	marginTop: "1rem",
	border: "1px solid #1f3428",
	background: "#0d1310",
	overflowX: "auto",
});

export const rankingTitle = style({
	margin: 0,
	padding: "0.9rem",
	borderBottom: "1px solid #1a2b22",
	color: "#d9a441",
	fontSize: "0.82rem",
	letterSpacing: "0.08em",
	textTransform: "uppercase",
});

export const table = style({
	width: "100%",
	borderCollapse: "collapse",
	minWidth: "600px",
});

globalStyle(`${table} th`, {
	padding: "0.7rem 0.9rem",
	borderBottom: "1px solid #17271e",
	color: "#708277",
	fontSize: "0.65rem",
	fontWeight: 400,
	letterSpacing: "0.06em",
	textAlign: "right",
	textTransform: "uppercase",
	whiteSpace: "nowrap",
});

globalStyle(`${table} td`, {
	padding: "0.7rem 0.9rem",
	borderBottom: "1px solid #17271e",
	color: "#d8ddd5",
	fontFamily: "Courier New, monospace",
	fontSize: "0.75rem",
	textAlign: "right",
	whiteSpace: "nowrap",
});

globalStyle(`${table} th:first-child`, { textAlign: "left" });
globalStyle(`${table} td:first-child`, { textAlign: "left" });
globalStyle(`${table} tbody tr:last-child td`, { borderBottom: 0 });
