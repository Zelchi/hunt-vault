import { globalStyle, keyframes, style } from "@vanilla-extract/css";

export const searchSlot = style({
	position: "relative",
	gridColumn: 2,
	width: "100%",
	maxWidth: "42rem",
	minWidth: 0,
	justifySelf: "center",
	zIndex: 30,
	"@media": {
		"screen and (max-width: 900px)": {
			maxWidth: "none",
		},
		"screen and (max-width: 640px)": {
			gridColumn: "auto",
			width: "100%",
		},
	},
});

export const searchForm = style({
	position: "relative",
	width: "100%",
	margin: "0 auto",
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
	height: "calc(2rem + 3px)",
	padding: "0.55rem 2.4rem 0.55rem 2.5rem",
	border: "2px solid #2b4638",
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
			border: "2px solid #d9a441",
		},
		"&:focus-visible": {
			outline: "none",
		},
		"&::-webkit-search-cancel-button": {
			display: "none",
		},
	},
	"@media": {
		"screen and (max-width: 640px)": {
			height: "calc(2rem + 3px)",
			paddingInline: "2.35rem",
			fontSize: "0.7rem",
		},
		"screen and (max-width: 400px)": {
			paddingLeft: "2.15rem",
			paddingRight: "2.1rem",
			fontSize: "0.66rem",
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

export const filterBar = style({
	display: "flex",
	width: "100%",
	gap: "0.35rem",
	justifyContent: "center",
	padding: "0.45rem 0.75rem",
	overflowX: "auto",
	borderBottom: "1px solid #1a2b22",
	background: "#101512",
	scrollbarWidth: "none",
	selectors: {
		"&::-webkit-scrollbar": {
			display: "none",
		},
	},
	"@media": {
		"screen and (max-width: 640px)": {
			justifyContent: "flex-start",
		},
	},
});

export const filterButton = style({
	flex: "0 0 auto",
	padding: "0.35rem 0.55rem",
	border: "1px solid #2b4638",
	borderRadius: 0,
	background: "#101512",
	color: "#8b9a8f",
	fontSize: "0.58rem",
	fontWeight: 700,
	letterSpacing: "0.04em",
	textTransform: "uppercase",
	whiteSpace: "nowrap",
	transition: "background 120ms ease, border-color 120ms ease, color 120ms ease",
	selectors: {
		"&:hover": {
			borderColor: "#526d5b",
			background: "#18231d",
			color: "#f4f1ea",
		},
		'&[data-active="true"]': {
			borderColor: "#d9a441",
			background: "#1b2c22",
			color: "#d9a441",
		},
	},
});

const searchLoadingSpin = keyframes({
	from: { transform: "rotate(0deg)" },
	to: { transform: "rotate(360deg)" },
});

export const loadingIndicator = style({
	display: "block",
	width: "0.85rem",
	height: "0.85rem",
	border: "2px solid #526d5b",
	borderTopColor: "#d9a441",
	borderRadius: "50%",
	animation: `${searchLoadingSpin} 700ms linear infinite`,
});

export const resultsPanel = style({
	position: "absolute",
	top: "calc(100% + 0.45rem)",
	right: 0,
	left: 0,
	height: "min(24rem, calc(100dvh - 5rem))",
	maxHeight: "min(24rem, calc(100dvh - 5rem))",
	border: "2px solid #2b4638",
	background: "#101512",
	boxShadow: "4px 4px 0 #050706",
	"@media": {
		"screen and (max-width: 640px)": {
			top: "calc(100% + 0.35rem)",
			height: "min(22rem, calc(100dvh - 12rem))",
			maxHeight: "min(22rem, calc(100dvh - 12rem))",
		},
	},
});

globalStyle(`${resultsPanel} > [role="scrollbar"]`, {
	top: 0,
	right: 0,
	bottom: 0,
	width: "0.75rem",
	borderTop: 0,
	borderBottom: 0,
	borderRight: 0,
});

globalStyle(`${resultsPanel} > [role="scrollbar"][data-visible="false"]`, {
	opacity: 1,
	pointerEvents: "none",
});

globalStyle(`${resultsPanel} > [role="scrollbar"][data-visible="false"] > div`, {
	opacity: 0,
});

export const resultsViewport = style({
	paddingRight: "1.1rem",
});

export const resultGroupTitle = style({
	padding: "0.55rem 0.75rem 0.35rem",
	borderBottom: "1px solid #1a2b22",
	color: "#d9a441",
	fontSize: "0.6rem",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
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
	width: "2.15rem",
	height: "2.15rem",
	padding: "0.15rem",
	border: "1px solid #2b4638",
	background: "#0a0e0c",
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
