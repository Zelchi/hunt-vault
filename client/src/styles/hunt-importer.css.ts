import { style } from "@vanilla-extract/css";

export const card = style({
	width: "100%",
	maxWidth: "52rem",
	padding: "2rem",
	border: "2px solid #2b4638",
	borderRadius: 0,
	background: "#121816",
	boxShadow: "4px 4px 0 #050706",
	display: "flex",
	gap: "30px",
	flexDirection: "column",
	alignItems: "center",
	"@media": {
		"screen and (max-width: 640px)": {
			padding: "1.25rem",
		},
	},
});

export const sectionTitle = style({
	margin: "0 0 0.5rem",
	color: "#e8b84e",
	fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
	letterSpacing: "0.04em",
	textTransform: "uppercase",
});

export const clipboardButton = style({
	width: "100%",
	padding: "0.875rem 1.25rem",
	border: "2px solid #d9a441",
	borderRadius: 0,
	background: "#d9a441",
	boxShadow: "3px 3px 0 #6f4e0d",
	color: "#17130c",
	fontSize: "0.85rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
	transition: "background 150ms ease, transform 150ms ease, box-shadow 150ms ease",
	selectors: {
		"&:hover": {
			background: "#edbd5a",
			boxShadow: "4px 4px 0 #6f4e0d",
			transform: "translate(-1px, -1px)",
		},
		"&:disabled": {
			cursor: "wait",
			opacity: 0.6,
			transform: "none",
		},
	},
});

export const saveButton = style({
	width: "100%",
	marginTop: "0.75rem",
	padding: "0.875rem 1.25rem",
	border: "2px solid #4fc47b",
	borderRadius: 0,
	background: "#102319",
	boxShadow: "3px 3px 0 #1d5e3a",
	color: "#70e0a0",
	fontSize: "0.85rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
	transition: "background 150ms ease, transform 150ms ease, box-shadow 150ms ease",
	selectors: {
		"&:hover": {
			background: "#163522",
			boxShadow: "4px 4px 0 #1d5e3a",
			transform: "translate(-1px, -1px)",
		},
		"&:disabled": {
			opacity: 0.45,
			transform: "none",
		},
	},
});

export const previewLabel = style({
	display: "block",
	margin: "1.5rem 0 0.5rem",
	color: "#d7d4cc",
	fontSize: "0.8rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
});

export const clipboardPreview = style({
	width: "100%",
	minHeight: "18rem",
	padding: "1rem",
	resize: "none",
	border: "2px solid #2b4638",
	borderRadius: 0,
	background: "#0a0e0c",
	boxShadow: "inset 0 0 0 1px rgb(217 164 65 / 8%)",
	color: "#d7d4cc",
	font: '0.875rem/1.6 "Courier New", ui-monospace, SFMono-Regular, Consolas, monospace',
	outline: "none",
	selectors: {
		"&:focus": {
			borderColor: "#526d5b",
			outline: "none",
			boxShadow: "inset 0 0 0 1px rgb(82 109 91 / 35%)",
		},
		"&:focus-visible": {
			borderColor: "#526d5b",
			outline: "none",
			boxShadow: "inset 0 0 0 1px rgb(82 109 91 / 35%)",
		},
	},
});

export const previewArea = style({
	width: "100%",
	maxHeight: 0,
	overflow: "hidden",
	opacity: 0,
	transform: "translateY(-0.5rem)",
	transition: "max-height 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
	"@media": {
		"(prefers-reduced-motion: reduce)": {
			maxHeight: "none",
			opacity: 1,
			transform: "none",
			transition: "none",
		},
	},
});
