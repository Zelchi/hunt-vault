import { style } from "@vanilla-extract/css";

export const backdrop = style({
	position: "fixed",
	inset: 0,
	width: "100vw",
	height: "100vh",
	maxWidth: "none",
	maxHeight: "none",
	margin: 0,
	border: 0,
	zIndex: 100,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: "1rem",
	boxSizing: "border-box",
	background: "rgb(3 6 5 / 82%)",
	backdropFilter: "blur(2px)",
	selectors: {
		"&::backdrop": { background: "transparent" },
	},
});

export const dialog = style({
	display: "flex",
	alignItems: "stretch",
	flexDirection: "column",
	width: "min(100%, 30rem)",
	padding: "1.5rem",
	border: "2px solid #d9a441",
	borderRadius: 0,
	background: "#121816",
	boxShadow: "6px 6px 0 #050706",
});

export const modalMark = style({
	alignSelf: "flex-start",
	marginBottom: "1rem",
	padding: "0.35rem 0.5rem",
	border: "2px solid #d9a441",
	background: "#2b2110",
	color: "#edbd5a",
	fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
	fontSize: "0.75rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
});

export const title = style({
	margin: 0,
	color: "#f4f1ea",
	fontSize: "1.25rem",
	letterSpacing: "0.04em",
	textTransform: "uppercase",
});

export const message = style({
	margin: "0.75rem 0 1.25rem",
	color: "#a5b2a7",
	fontSize: "0.9rem",
	lineHeight: 1.6,
});

export const label = style({
	marginBottom: "0.5rem",
	color: "#d7d4cc",
	fontSize: "0.8rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
});

export const input = style({
	width: "100%",
	boxSizing: "border-box",
	padding: "0.75rem",
	border: "2px solid #526d5b",
	borderRadius: 0,
	background: "#0a0e0c",
	color: "#f4f1ea",
	font: '0.9rem "Courier New", ui-monospace, SFMono-Regular, Consolas, monospace',
	outline: "none",
	selectors: {
		"&:focus": { borderColor: "#d9a441", boxShadow: "0 0 0 2px rgb(217 164 65 / 18%)" },
	},
});

export const error = style({
	margin: "0.5rem 0 0",
	color: "#f08e83",
	fontSize: "0.8rem",
});

export const actions = style({
	display: "grid",
	gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
	gap: "0.75rem",
	marginTop: "1.5rem",
	"@media": { "screen and (max-width: 420px)": { gridTemplateColumns: "1fr" } },
});

export const cancelButton = style({
	padding: "0.75rem 1rem",
	border: "2px solid #526d5b",
	borderRadius: 0,
	background: "#101512",
	color: "#b7c7ba",
	fontSize: "0.8rem",
	fontWeight: 700,
	letterSpacing: "0.06em",
	textTransform: "uppercase",
});

export const submitButton = style({
	padding: "0.75rem 1rem",
	border: "2px solid #d9a441",
	borderRadius: 0,
	background: "#d9a441",
	color: "#17130c",
	fontSize: "0.8rem",
	fontWeight: 700,
	letterSpacing: "0.06em",
	textTransform: "uppercase",
});
