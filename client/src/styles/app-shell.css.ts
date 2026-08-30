import { style } from "@vanilla-extract/css";

export const page = style({
	height: "100vh",
	minHeight: "100dvh",
	display: "flex",
	flexDirection: "column",
	overflow: "hidden",
	backgroundColor: "#0c100f",
	backgroundImage:
		"linear-gradient(rgb(93 150 104 / 4%) 1px, transparent 1px), linear-gradient(90deg, rgb(93 150 104 / 4%) 1px, transparent 1px)",
	backgroundSize: "4px 4px",
	color: "#f4f1ea",
});

export const header = style({
	flex: "0 0 auto",
	maxHeight: "10rem",
	display: "grid",
	gridTemplateColumns: "minmax(15.5rem, 1fr) minmax(18rem, 42rem) minmax(15.5rem, 1fr)",
	alignItems: "center",
	gap: "1rem",
	padding: "0.7rem clamp(0.75rem, 2vw, 2rem)",
	background: "#101512",
	borderBottom: "2px solid #284336",
	boxShadow: "0 3px 0 #070a09",
	overflow: "visible",
	zIndex: 10,
	transform: "translateY(0)",
	opacity: 1,
	transition:
		"max-height 260ms ease, padding 260ms ease, border-bottom-width 260ms ease, border-bottom-color 260ms ease, box-shadow 260ms ease, transform 260ms ease, opacity 180ms ease",
	selectors: {
		'&[data-visible="false"]': {
			maxHeight: 0,
			paddingTop: 0,
			paddingBottom: 0,
			borderBottomWidth: 0,
			borderBottomColor: "transparent",
			boxShadow: "none",
			transform: "translateY(-0.75rem)",
			opacity: 0,
			pointerEvents: "none",
			overflow: "hidden",
		},
	},
	"@media": {
		"screen and (max-width: 900px)": {
			gridTemplateColumns: "minmax(0, 1fr) minmax(14rem, 1.5fr) minmax(0, 1fr)",
			gap: "0.65rem",
			padding: "0.6rem 0.75rem",
		},
		"screen and (max-width: 680px)": {
			gridTemplateColumns: "minmax(0, 1fr) minmax(14rem, 1fr) minmax(0, 1fr)",
		},
		"screen and (max-width: 640px)": {
			display: "flex",
			alignItems: "stretch",
			flexDirection: "column",
			gap: "0.6rem",
			padding: "0.65rem 0.75rem",
		},
	},
});

export const brand = style({
	gridColumn: 1,
	justifySelf: "start",
	display: "flex",
	alignItems: "center",
	gap: "0.55rem",
	minWidth: 0,
	fontSize: "1rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
	color: "#f4f1ea",
	whiteSpace: "nowrap",
	"@media": {
		"screen and (max-width: 900px)": {
			gap: "0.45rem",
			fontSize: "0.88rem",
		},
		"screen and (max-width: 640px)": {
			width: "100%",
			justifyContent: "center",
		},
	},
});

export const brandIcon = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "2rem",
	height: "2rem",
	border: "2px solid #d9a441",
	borderRadius: 0,
	background: "#d9a441",
	boxShadow: "2px 2px 0 #6f4e0d",
	color: "#17130c",
	fontSize: "1rem",
	lineHeight: 0,
});

export const nav = style({
	gridColumn: 3,
	justifySelf: "end",
	display: "flex",
	minWidth: 0,
	gap: "0.55rem",
	"@media": {
		"screen and (max-width: 900px)": {
			gap: "0.45rem",
		},
		"screen and (max-width: 640px)": {
			width: "100%",
		},
	},
});

export const navButton = style({
	width: "7.5rem",
	height: "2rem",
	padding: "0.4rem 0.75rem",
	border: "1px solid transparent",
	borderRadius: 0,
	background: "transparent",
	color: "#a5a8b2",
	fontSize: "0.72rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textAlign: "center",
	textTransform: "uppercase",
	transition: "background 150ms ease, color 150ms ease, box-shadow 150ms ease",
	selectors: {
		'&[data-active="true"]': {
			borderColor: "#d9a441",
			background: "#d9a441",
			boxShadow: "2px 2px 0 #6f4e0d",
			color: "#0c100f",
		},
		"&:hover": {
			borderColor: "#526d5b",
			background: "#18231d",
			color: "#f4f1ea",
		},
	},
	"@media": {
		"screen and (max-width: 900px)": {
			width: "6.5rem",
			paddingInline: "0.5rem",
			fontSize: "0.66rem",
		},
		"screen and (max-width: 800px)": {
			width: "5.5rem",
			paddingInline: "0.35rem",
			fontSize: "0.6rem",
		},
		"screen and (max-width: 640px)": {
			flex: 1,
			width: "auto",
		},
	},
});
