import { style } from "@vanilla-extract/css";

export const searchSlot = style({
	position: "relative",
	gridColumn: 2,
	width: "100%",
	minWidth: 0,
	zIndex: 30,
	"@media": {
		"screen and (max-width: 640px)": {
			gridColumn: "auto",
			width: "100%",
		},
	},
});

export const searchForm = style({
	position: "relative",
	width: "100%",
});

export const searchIcon = style({
	position: "absolute",
	top: "50%",
	left: "0.75rem",
	transform: "translateY(-50%)",
	pointerEvents: "none",
	color: "#8ba66f",
});

export const searchInput = style({
	width: "100%",
	height: "2.4rem",
	padding: "0.55rem 2.4rem 0.55rem 2.5rem",
	border: "1px solid #2b4638",
	borderRadius: 0,
	background: "#0a0e0c",
	boxShadow: "inset 0 0 0 1px rgb(217 164 65 / 5%)",
	color: "#f4f1ea",
	fontSize: "0.72rem",
	letterSpacing: "0.025em",
	outline: "none",
	transition: "border-color 150ms ease, box-shadow 150ms ease",
	selectors: {
		"&::placeholder": {
			color: "#637469",
		},
		"&:focus": {
			borderColor: "#d9a441",
			boxShadow: "inset 0 0 0 1px rgb(217 164 65 / 28%), 0 0 0 2px rgb(217 164 65 / 9%)",
		},
		"&::-webkit-search-cancel-button": {
			display: "none",
		},
	},
});

export const clearButton = style({
	position: "absolute",
	top: "50%",
	right: "0.45rem",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "1.7rem",
	height: "1.7rem",
	padding: 0,
	transform: "translateY(-50%)",
	border: "1px solid transparent",
	borderRadius: 0,
	background: "transparent",
	color: "#8b9a8f",
	fontSize: "1.1rem",
	lineHeight: 1,
	selectors: {
		"&:hover": {
			borderColor: "#526d5b",
			background: "#18231d",
			color: "#f4f1ea",
		},
	},
});

export const resultsPanel = style({
	position: "absolute",
	top: "calc(100% + 0.45rem)",
	right: 0,
	left: 0,
	maxHeight: "min(24rem, calc(100vh - 5rem))",
	overflowY: "auto",
	border: "2px solid #2b4638",
	background: "#101512",
	boxShadow: "4px 4px 0 #050706",
});

export const result = style({
	display: "flex",
	alignItems: "center",
	width: "100%",
	minHeight: "3.4rem",
	gap: "0.7rem",
	padding: "0.65rem 0.75rem",
	border: 0,
	borderBottom: "1px solid #1a2b22",
	background: "transparent",
	color: "inherit",
	textDecoration: "none",
	textAlign: "left",
	transition: "background 120ms ease, border-color 120ms ease",
	selectors: {
		"&:hover": {
			background: "#18231d",
		},
		'&[data-active="true"]': {
			background: "#1b2c22",
			boxShadow: "inset 3px 0 0 #d9a441",
		},
	},
});

export const resultImage = style({
	flex: "0 0 auto",
	width: "2rem",
	height: "2rem",
	objectFit: "contain",
	imageRendering: "pixelated",
});

export const resultBody = style({
	display: "flex",
	minWidth: 0,
	flex: "1 1 auto",
	flexDirection: "column",
	gap: "0.2rem",
});

export const resultTopline = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: "0.65rem",
	minWidth: 0,
});

export const resultTitle = style({
	overflow: "hidden",
	color: "#f4f1ea",
	fontSize: "0.76rem",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
});

export const resultKind = style({
	flex: "0 0 auto",
	padding: "0.18rem 0.3rem",
	border: "1px solid #526d5b",
	color: "#8ba66f",
	fontSize: "0.57rem",
	fontWeight: 700,
	letterSpacing: "0.06em",
	textTransform: "uppercase",
});

export const resultSnippet = style({
	overflow: "hidden",
	color: "#718176",
	fontSize: "0.65rem",
	lineHeight: 1.35,
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
});

export const searchStatus = style({
	padding: "0.8rem 0.75rem",
	borderBottom: "1px solid #1a2b22",
	color: "#8b9a8f",
	fontSize: "0.68rem",
	lineHeight: 1.4,
	selectors: {
		'&[data-error="true"]': {
			color: "#e08080",
		},
	},
});

export const searchFooter = style({
	padding: "0.45rem 0.75rem",
	color: "#607267",
	fontSize: "0.58rem",
	letterSpacing: "0.03em",
});
