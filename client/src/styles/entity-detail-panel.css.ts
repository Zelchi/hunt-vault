import { globalStyle, style } from "@vanilla-extract/css";

export const overlay = style({
	position: "fixed",
	inset: 0,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: "1rem",
	background: "rgb(3 6 5 / 78%)",
	zIndex: 60,
	"@media": {
		"screen and (max-width: 640px)": {
			alignItems: "flex-end",
			padding: "0.5rem",
		},
	},
});

export const panel = style({
	display: "flex",
	width: "min(60rem, 100%)",
	maxHeight: "min(46rem, calc(100dvh - 2rem))",
	flexDirection: "column",
	border: "2px solid #2b4638",
	background: "#101512",
	boxShadow: "5px 5px 0 #050706",
	"@media": {
		"screen and (max-width: 640px)": {
			maxHeight: "calc(100dvh - 1rem)",
		},
	},
});

export const panelHeader = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: "1rem",
	padding: "0.9rem 1rem",
	borderBottom: "2px solid #2b4638",
	background: "#121816",
});

export const entityHeading = style({
	display: "flex",
	alignItems: "center",
	minWidth: 0,
	gap: "0.75rem",
});

export const entityImage = style({
	flex: "0 0 auto",
	width: "3rem",
	height: "3rem",
	objectFit: "contain",
	imageRendering: "pixelated",
});

export const panelKicker = style({
	marginBottom: "0.25rem",
	color: "#d9a441",
	fontSize: "0.62rem",
	fontWeight: 700,
	letterSpacing: "0.1em",
	textTransform: "uppercase",
});

export const panelTitle = style({
	margin: 0,
	overflow: "hidden",
	color: "#f4f1ea",
	fontSize: "clamp(1.05rem, 3vw, 1.45rem)",
	letterSpacing: "0.04em",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
});

export const closeButton = style({
	flex: "0 0 auto",
	width: "2rem",
	height: "2rem",
	padding: 0,
	border: "1px solid #526d5b",
	borderRadius: 0,
	background: "transparent",
	color: "#a5a8b2",
	fontSize: "1.25rem",
	lineHeight: 1,
	selectors: {
		"&:hover": {
			borderColor: "#d9a441",
			background: "#18231d",
			color: "#f4f1ea",
		},
	},
});

export const panelBody = style({
	flex: "1 1 auto",
	minHeight: 0,
});

export const panelBodyViewport = style({
	padding: "1rem 1.15rem",
	selectors: {
		'&[data-scrollable="true"]': {
			paddingRight: "1.80rem",
		},
	},
});

export const panelStatus = style({
	padding: "3rem 1rem",
	color: "#8b9a8f",
	fontSize: "0.78rem",
	lineHeight: 1.5,
	textAlign: "center",
	selectors: {
		'&[data-error="true"]': {
			color: "#e08080",
		},
	},
});

export const creatureSummary = style({
	display: "flex",
	flexDirection: "column",
	gap: "1rem",
	color: "#d7d4cc",
	fontFamily: '"Courier New", ui-monospace, SFMono-Regular, Consolas, monospace',
	fontSize: "0.78rem",
	lineHeight: 1.5,
	userSelect: "text",
});

export const itemSummary = style({
	display: "flex",
	flexDirection: "column",
	gap: "0.75rem",
	color: "#d7d4cc",
	fontFamily: '"Courier New", ui-monospace, SFMono-Regular, Consolas, monospace',
	fontSize: "0.78rem",
	lineHeight: 1.5,
	userSelect: "text",
});

export const itemStats = style({
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(8.5rem, 1fr))",
	gap: "0.55rem",
});

export const itemStat = style({
	display: "flex",
	minWidth: 0,
	flexDirection: "column",
	gap: "0.15rem",
	padding: "0.55rem 0.6rem",
	border: "1px solid #2b4638",
	background: "#0d1310",
});

export const itemStatLabel = style({
	color: "#a9c38a",
	fontSize: "0.64rem",
	letterSpacing: "0.04em",
	textTransform: "uppercase",
});

export const itemStatValue = style({
	color: "#f4f1ea",
	fontSize: "0.78rem",
	fontWeight: 700,
	overflowWrap: "anywhere",
});

export const itemDescription = style({
	margin: 0,
	color: "#d7d4cc",
	lineHeight: 1.65,
});

export const itemSourceList = style({
	display: "flex",
	flexDirection: "column",
	gap: "0.5rem",
});

export const itemSource = style({
	display: "flex",
	minWidth: 0,
	flexDirection: "column",
	gap: "0.15rem",
	paddingBottom: "0.45rem",
	borderBottom: "1px solid #1f3428",
	selectors: {
		"&:last-child": {
			paddingBottom: 0,
			borderBottom: "none",
		},
	},
});

export const itemSourceLabel = style({
	color: "#a9c38a",
	fontSize: "0.64rem",
	fontWeight: 700,
	letterSpacing: "0.04em",
	textTransform: "uppercase",
});

export const itemSourceValue = style({
	color: "#d7d4cc",
	overflowWrap: "anywhere",
});

export const itemSourceLink = style({
	alignSelf: "flex-start",
	padding: "0.45rem 0.65rem",
	border: "1px solid #2b4638",
	background: "#0d1310",
	color: "#a9c38a",
	fontSize: "0.68rem",
	letterSpacing: "0.03em",
	textDecoration: "none",
	selectors: {
		"&:hover": {
			borderColor: "#557d5f",
			color: "#d9a441",
		},
	},
});

export const summarySection = style({
	padding: "0.85rem",
	border: "1px solid #2b4638",
	background: "#121816",
});

export const summaryTitle = style({
	margin: "0 0 0.7rem",
	paddingBottom: "0.4rem",
	borderBottom: "1px solid #1f3428",
	color: "#d9a441",
	fontSize: "0.85rem",
	letterSpacing: "0.05em",
	textTransform: "uppercase",
});

export const summaryEmpty = style({
	margin: 0,
	color: "#d7d4cc",
	lineHeight: 1.7,
});

export const lootList = style({
	margin: 0,
	paddingLeft: "1.25rem",
	color: "#d7d4cc",
	lineHeight: 1.7,
	userSelect: "text",
});

export const resistanceGroup = style({
	display: "flex",
	flexDirection: "column",
	gap: "0.45rem",
	marginBottom: "0.9rem",
	selectors: {
		"&:last-child": {
			marginBottom: 0,
		},
	},
});

export const resistanceGroupTitle = style({
	margin: 0,
	color: "#a9c38a",
	fontSize: "0.7rem",
	letterSpacing: "0.04em",
	textTransform: "uppercase",
});

export const resistanceGrid = style({
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))",
	gap: "0.55rem",
});

export const resistanceItem = style({
	display: "flex",
	minWidth: 0,
	flexDirection: "column",
	gap: "0.15rem",
	padding: "0.6rem",
	border: "1px solid #2b4638",
	background: "#0d1310",
	selectors: {
		'&[data-type="immune"]': {
			borderColor: "#a95656",
		},
		'&[data-type="strong"]': {
			borderColor: "#557d5f",
		},
		'&[data-type="weak"]': {
			borderColor: "#9b7040",
		},
	},
});

export const resistanceLabel = style({
	display: "flex",
	alignItems: "center",
	minHeight: "1.2rem",
	gap: "0.35rem",
	color: "#c3d4b0",
	fontSize: "0.78rem",
	fontWeight: 700,
	letterSpacing: "0.03em",
	textTransform: "uppercase",
});

export const resistanceIcon = style({
	flex: "0 0 auto",
	width: "1.1rem",
	height: "1.1rem",
	objectFit: "contain",
	imageRendering: "pixelated",
});

globalStyle(`${resistanceItem} strong`, {
	color: "#f4f1ea",
	fontSize: "0.95rem",
});

globalStyle(`${resistanceItem} small`, {
	color: "#a9c38a",
	fontSize: "0.62rem",
});

export const wikiContent = style({
	minWidth: 0,
	maxWidth: "100%",
	color: "#d7d4cc",
	fontFamily: '"Courier New", ui-monospace, SFMono-Regular, Consolas, monospace',
	fontSize: "0.78rem",
	lineHeight: 1.55,
	userSelect: "text",
});

globalStyle(`${wikiContent} h1`, {
	margin: "0 0 1rem",
	paddingBottom: "0.65rem",
	borderBottom: "1px solid #2b4638",
	color: "#f4f1ea",
	fontSize: "1.25rem",
});

globalStyle(`${wikiContent} h2`, {
	margin: "1.4rem 0 0.65rem",
	paddingBottom: "0.35rem",
	borderBottom: "1px solid #1f3428",
	color: "#d9a441",
	fontSize: "0.95rem",
});

globalStyle(`${wikiContent} h3`, {
	margin: "1rem 0 0.45rem",
	color: "#a9c38a",
	fontSize: "0.85rem",
});

globalStyle(`${wikiContent} p`, {
	margin: "0.55rem 0",
});

globalStyle(`${wikiContent} ul, ${wikiContent} ol`, {
	paddingLeft: "1.4rem",
});

globalStyle(`${wikiContent} table`, {
	width: "100%",
	maxWidth: "100%",
	minWidth: 0,
	margin: "0.75rem 0",
	borderCollapse: "collapse",
	fontSize: "0.72rem",
});

globalStyle(`${wikiContent} th, ${wikiContent} td`, {
	padding: "0.45rem 0.55rem",
	border: "1px solid #2b4638",
	overflowWrap: "anywhere",
	textAlign: "left",
	verticalAlign: "top",
});

globalStyle(`${wikiContent} table.infobox > tbody > tr > td:first-child`, {
	width: "1%",
	whiteSpace: "nowrap",
});

globalStyle(`${wikiContent} th`, {
	background: "#18231d",
	color: "#f4f1ea",
});

globalStyle(`${wikiContent} img`, {
	maxWidth: "100%",
	height: "auto",
});

globalStyle(`${wikiContent} a`, {
	color: "#8ba66f",
	textDecoration: "underline",
});

globalStyle(`${wikiContent} .mw-editsection, ${wikiContent} .mw-empty-elt`, {
	display: "none",
});

export const panelFooter = style({
	display: "flex",
	justifyContent: "flex-end",
	padding: "0.65rem 1rem",
	borderTop: "1px solid #2b4638",
	background: "#0d1310",
	fontSize: "0.65rem",
});
