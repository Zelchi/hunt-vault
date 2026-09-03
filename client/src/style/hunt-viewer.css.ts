import { globalStyle, style } from "@vanilla-extract/css";

export const card = style({
	width: "100%",
	maxWidth: "74rem",
	padding: "2rem",
	border: "2px solid #2b4638",
	borderRadius: 0,
	background: "#121816",
	boxShadow: "4px 4px 0 #050706",
	"@media": {
		"screen and (max-width: 640px)": {
			padding: "1.25rem",
		},
	},
});

export const partyMembers = style({
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
	gap: "0.75rem",
	marginBottom: "1.5rem",
});

export const partyMemberCard = style({
	padding: "1rem",
	border: "2px solid #526d5b",
	borderRadius: 0,
	background: "#18231d",
	boxShadow: "2px 2px 0 #070a09",
});

export const partyMemberName = style({
	margin: "0 0 0.75rem",
	color: "#f4f1ea",
	fontSize: "0.95rem",
	lineHeight: 1.35,
});

export const leaderBadge = style({
	display: "inline-block",
	marginLeft: "0.5rem",
	padding: "0.2rem 0.35rem",
	border: "1px solid #d9a441",
	color: "#d9a441",
	fontSize: "0.65rem",
	letterSpacing: "0.08em",
	verticalAlign: "middle",
});

export const partyMetricList = style({
	display: "grid",
	gridTemplateColumns: "auto 1fr",
	gap: "0.35rem 0.75rem",
	margin: 0,
	fontSize: "0.75rem",
});

export const partyMetricLabel = style({
	color: "#8e929d",
});

export const partyMetricValue = style({
	margin: 0,
	color: "#70e0a0",
	textAlign: "right",
});

export const partyRankingGrid = style({
	display: "grid",
	gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
	gap: "0.75rem",
	marginBottom: "1.5rem",
	"@media": {
		"screen and (max-width: 760px)": {
			gridTemplateColumns: "1fr",
		},
	},
});

export const partyRanking = style({
	padding: "1rem",
	border: "2px solid #8c6c26",
	borderRadius: 0,
	background: "#101512",
	boxShadow: "2px 2px 0 #070a09",
});

export const partyRankingTitle = style({
	margin: "0 0 0.75rem",
	color: "#d9a441",
	fontSize: "0.8rem",
	letterSpacing: "0.08em",
	textTransform: "uppercase",
});

export const partyRankingName = style({
	display: "block",
	color: "#f4f1ea",
	fontSize: "0.8rem",
	overflowWrap: "anywhere",
});

export const partyRankingValue = style({
	display: "block",
	marginTop: "0.25rem",
	color: "#70e0a0",
	fontSize: "0.9rem",
	fontWeight: 700,
});

export const viewerHeader = style({
	display: "flex",
	alignItems: "flex-start",
	justifyContent: "space-between",
	gap: "1rem",
	marginBottom: "1.5rem",
	"@media": {
		"screen and (max-width: 640px)": {
			flexDirection: "column",
		},
	},
});

export const viewerTitle = style({
	margin: 0,
	color: "#e8b84e",
	fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
	letterSpacing: "0.04em",
	textTransform: "uppercase",
});

export const viewerCounter = style({
	padding: "0.5rem 0.75rem",
	border: "2px solid #526d5b",
	borderRadius: 0,
	background: "#101512",
	boxShadow: "2px 2px 0 #070a09",
	color: "#d7d4cc",
	fontSize: "0.8rem",
	fontWeight: 600,
	letterSpacing: "0.05em",
	whiteSpace: "nowrap",
});

export const viewerActions = style({
	display: "flex",
	alignItems: "center",
	gap: "0.75rem",
	"@media": {
		"screen and (max-width: 640px)": {
			width: "100%",
			justifyContent: "space-between",
		},
	},
});

export const deleteButton = style({
	padding: "0.5rem 0.75rem",
	border: "2px solid #b85a51",
	borderRadius: 0,
	background: "#2b1514",
	boxShadow: "2px 2px 0 #702c27",
	color: "#f08e83",
	fontSize: "0.75rem",
	fontWeight: 700,
	letterSpacing: "0.06em",
	textTransform: "uppercase",
	transition: "background 150ms ease, color 150ms ease, transform 150ms ease",
	selectors: {
		"&:hover": {
			background: "#4a1d1b",
			color: "#ffc0b9",
			transform: "translate(-1px, -1px)",
		},
	},
});

export const carousel = style({
	display: "flex",
	alignItems: "center",
	gap: "0.75rem",
	marginBottom: "1.5rem",
});

export const carouselButton = style({
	flex: "0 0 auto",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "2.75rem",
	height: "2.75rem",
	border: "2px solid #d9a441",
	borderRadius: 0,
	background: "#101512",
	boxShadow: "3px 3px 0 #6f4e0d",
	color: "#d9a441",
	fontSize: "1.25rem",
	transition: "background 150ms ease, transform 150ms ease",
	selectors: {
		"&:hover": {
			background: "#18231d",
			boxShadow: "4px 4px 0 #6f4e0d",
			transform: "translate(-1px, -1px)",
		},
	},
});

export const carouselTrack = style({
	flex: 1,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	gap: "0.5rem",
	minWidth: 0,
});

export const carouselHint = style({
	color: "#777b88",
	fontSize: "0.75rem",
	textAlign: "center",
});

export const sessionBanner = style({
	display: "grid",
	gridTemplateColumns: "minmax(0, 1fr) minmax(8rem, auto) minmax(10rem, auto)",
	gap: "1rem",
	marginBottom: "1.5rem",
	padding: "1rem 1.25rem",
	border: "2px solid #8c6c26",
	borderRadius: 0,
	background: "#18231d",
	boxShadow: "inset 4px 0 0 #d9a441",
	"@media": {
		"screen and (max-width: 640px)": {
			gridTemplateColumns: "1fr",
		},
	},
});

export const sessionLabel = style({
	display: "block",
	marginBottom: "0.35rem",
	color: "#a5a8b2",
	fontSize: "0.75rem",
	fontWeight: 600,
	textTransform: "uppercase",
	letterSpacing: "0.08em",
});

export const sessionValue = style({
	color: "#f4f1ea",
	fontSize: "0.95rem",
	lineHeight: 1.5,
});

export const sessionSaved = style({
	textAlign: "right",
	"@media": {
		"screen and (max-width: 640px)": {
			textAlign: "left",
		},
	},
});

export const panelEmpty = style({
	margin: 0,
	color: "#777b88",
	fontSize: "0.875rem",
});

export const rawDetails = style({
	marginTop: "1rem",
	border: "1px solid #2b4638",
	borderRadius: 0,
	background: "#101512",
});

export const rawTextScroller = style({
	maxHeight: "24rem",
});

globalStyle(`${rawDetails} summary`, {
	padding: "1rem 1.25rem",
	color: "#a5a8b2",
	fontSize: "0.875rem",
	fontWeight: 600,
	userSelect: "none",
});

export const rawText = style({
	margin: 0,
	padding: "0 1.25rem 1.25rem",
	color: "#b9bcc5",
	font: "0.8rem/1.6 ui-monospace, SFMono-Regular, Consolas, monospace",
	whiteSpace: "pre-wrap",
	userSelect: "text",
});

export const rawTextViewport = style({
	paddingTop: "1rem",
});

export const emptyState = style({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	padding: "3rem 1.5rem",
	textAlign: "center",
	color: "#777b88",
});

export const emptyIcon = style({
	width: "4rem",
	height: "4rem",
	marginBottom: "1rem",
	border: "2px solid #d9a441",
	borderRadius: 0,
	background: "#18231d",
	boxShadow: "3px 3px 0 #6f4e0d",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	color: "#d9a441",
	fontSize: "1.5rem",
});

export const emptyAction = style({
	marginTop: "1rem",
	padding: "0.65rem 1rem",
	border: "2px solid #d9a441",
	borderRadius: 0,
	background: "#101512",
	boxShadow: "3px 3px 0 #6f4e0d",
	color: "#d9a441",
	fontSize: "0.875rem",
	fontWeight: 600,
	selectors: {
		"&:hover": {
			background: "#18231d",
			transform: "translate(-1px, -1px)",
		},
	},
});

export const loadingState = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	minHeight: "18rem",
	color: "#777b88",
});
