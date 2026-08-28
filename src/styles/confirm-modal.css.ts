import { keyframes, style } from "@vanilla-extract/css";

const backdropIn = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 },
});

const dialogIn = keyframes({
	from: {
		opacity: 0,
		transform: "translateY(-0.75rem)",
	},
	to: {
		opacity: 1,
		transform: "translateY(0)",
	},
});

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
	animation: `${backdropIn} 160ms ease-out`,
	selectors: {
		"&::backdrop": {
			background: "transparent",
		},
	},
});

export const dialog = style({
	display: "flex",
	alignItems: "center",
	flexDirection: "column",
	width: "min(100%, 30rem)",
	padding: "1.5rem",
	border: "2px solid #b85a51",
	borderRadius: 0,
	background: "#121816",
	boxShadow: "6px 6px 0 #050706",
	animation: `${dialogIn} 180ms ease-out`,
	"@media": {
		"screen and (max-width: 640px)": {
			padding: "1.25rem",
		},
	},
});

export const modalMark = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "2.75rem",
	height: "2.75rem",
	marginBottom: "1rem",
	border: "2px solid #b85a51",
	borderRadius: 0,
	background: "#2b1514",
	color: "#f08e83",
	fontSize: "1.25rem",
	fontWeight: 700,
});

export const title = style({
	margin: 0,
	color: "#f4f1ea",
	fontSize: "1.25rem",
	letterSpacing: "0.04em",
	textTransform: "uppercase",
});

export const message = style({
	margin: "0.75rem 0 1.5rem",
	color: "#a5b2a7",
	fontSize: "0.9rem",
	lineHeight: 1.6,
});

export const actions = style({
	display: "grid",
	gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
	gap: "0.75rem",
	"@media": {
		"screen and (max-width: 420px)": {
			gridTemplateColumns: "1fr",
		},
	},
});

const actionButton = style({
	padding: "0.75rem 1rem",
	border: "2px solid",
	borderRadius: 0,
	fontSize: "0.8rem",
	fontWeight: 700,
	letterSpacing: "0.06em",
	textTransform: "uppercase",
	transition: "background 150ms ease, color 150ms ease, transform 150ms ease",
	selectors: {
		"&:disabled": {
			cursor: "wait",
			opacity: 0.5,
			transform: "none",
		},
	},
});

export const cancelButton = style([
	actionButton,
	{
		borderColor: "#526d5b",
		background: "#101512",
		color: "#b7c7ba",
		selectors: {
			"&:hover:not(:disabled)": {
				background: "#1a2b22",
				color: "#f4f1ea",
				transform: "translate(-1px, -1px)",
			},
		},
	},
]);

export const confirmButton = style([
	actionButton,
	{
		borderColor: "#b85a51",
		background: "#2b1514",
		color: "#f08e83",
		selectors: {
			"&:hover:not(:disabled)": {
				background: "#4a1d1b",
				color: "#ffc0b9",
				transform: "translate(-1px, -1px)",
			},
		},
	},
]);
