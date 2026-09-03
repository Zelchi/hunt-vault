import { style } from "@vanilla-extract/css";

export const mainFrame = style({
	position: "relative",
	flex: 1,
	minHeight: 0,
	width: "100%",
	overflow: "hidden",
});

export const main = style({
	height: "100%",
	minHeight: 0,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "flex-start",
	gap: "1.5rem",
	width: "100%",
	padding: "2rem 1rem 4rem",
	overflowX: "hidden",
	overflowY: "auto",
	scrollbarWidth: "none",
	selectors: {
		"&::-webkit-scrollbar": {
			display: "none",
			width: 0,
			height: 0,
		},
	},
});

export const nestedFrame = style({
	position: "relative",
	display: "flex",
	minHeight: 0,
	width: "100%",
	flexDirection: "column",
	overflow: "hidden",
});

export const nestedMain = style({
	minHeight: 0,
	width: "100%",
	flex: "1 1 auto",
	paddingRight: "1.1rem",
	overflowX: "hidden",
	overflowY: "auto",
	scrollbarWidth: "none",
	selectors: {
		"&::-webkit-scrollbar": {
			display: "none",
			width: 0,
			height: 0,
		},
	},
});

export const horizontalMain = style({
	minHeight: 0,
	width: "100%",
	flex: "1 1 auto",
	paddingBottom: "1.1rem",
	overflowX: "auto",
	overflowY: "hidden",
	scrollbarWidth: "none",
	selectors: {
		"&::-webkit-scrollbar": {
			display: "none",
			width: 0,
			height: 0,
		},
	},
});

export const scrollbar = style({
	position: "absolute",
	top: "0.85rem",
	right: "0.6rem",
	bottom: "0.85rem",
	width: "0.9rem",
	padding: "0.15rem",
	border: "1px solid #1a2b22",
	background: "#080b0a",
	boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 45%), 2px 2px 0 #050706",
	opacity: 0,
	pointerEvents: "none",
	transition: "opacity 160ms ease, background 160ms ease",
	zIndex: 5,
	cursor: 'url("/link.cur") 0 0, pointer',
	selectors: {
		'&[data-visible="true"]': {
			opacity: 1,
			pointerEvents: "auto",
		},
		"&:hover": {
			background: "#0d1310",
		},
		"&:focus-visible": {
			outline: "2px solid #d9a441",
			outlineOffset: 2,
		},
	},
	"@media": {
		"screen and (max-width: 640px)": {
			right: "0.35rem",
			width: "0.8rem",
		},
	},
});

export const scrollbarThumb = style({
	width: "100%",
	border: "2px solid #080b0a",
	background: "linear-gradient(180deg, #d9a441 0%, #8ba66f 22%, #52745c 100%)",
	boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 16%)",
	transition: "background 120ms ease, boxShadow 120ms ease",
	cursor: 'url("/link.cur") 0 0, grab',
	selectors: {
		"&:hover": {
			background: "linear-gradient(180deg, #f1c862 0%, #a9c38a 22%, #668d70 100%)",
		},
		'&[data-dragging="true"]': {
			background: "#d9a441",
			boxShadow: "inset 0 0 0 1px #f1c862",
			cursor: 'url("/link.cur") 0 0, grabbing',
		},
	},
});

export const nestedScrollbar = style({
	top: "0.35rem",
	right: "0.3rem",
	bottom: "0.35rem",
	width: "0.75rem",
});

export const minimalScrollbar = style({
	padding: 0,
	border: 0,
	background: "transparent",
	boxShadow: "none",
});

export const horizontalScrollbar = style({
	top: "auto",
	right: "0.3rem",
	bottom: "0.3rem",
	left: "0.3rem",
	width: "auto",
	height: "0.75rem",
	"@media": {
		"screen and (max-width: 640px)": {
			right: "0.3rem",
			width: "auto",
			height: "0.7rem",
		},
	},
});
