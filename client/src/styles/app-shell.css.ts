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
	gridTemplateColumns: "minmax(0, 1fr) minmax(16rem, 34rem) minmax(0, 1fr)",
	alignItems: "center",
	gap: "1rem",
	padding: "0.65rem 1rem",
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
		"screen and (max-width: 640px)": {
			display: "flex",
			alignItems: "flex-start",
			flexDirection: "column",
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
	fontSize: "1rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
	color: "#f4f1ea",
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
	gap: "0.35rem",
	"@media": {
		"screen and (max-width: 640px)": {
			width: "100%",
		},
	},
});

export const navButton = style({
	width: "7.5rem",
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
		"screen and (max-width: 640px)": {
			flex: 1,
			width: "auto",
		},
	},
});
