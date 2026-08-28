import { globalStyle } from "@vanilla-extract/css";

globalStyle(":root", {
	colorScheme: "dark",
	fontFamily: '"Courier New", ui-monospace, SFMono-Regular, Consolas, monospace',
	color: "#f4f1ea",
	background: "#0c100f",
});

globalStyle("*", {
	boxSizing: "border-box",
	cursor: 'url("/normal.cur") 0 0, auto',
	scrollbarColor: "#63836c #080b0a",
	scrollbarWidth: "thin",
	userSelect: "none",
});

globalStyle('button[class], a[class], [role="button"], summary, label, input[type="button"], input[type="submit"], input[type="reset"]', {
	cursor: 'url("/link.cur") 0 0, pointer',
});

globalStyle("*::-webkit-scrollbar", {
	width: 12,
	height: 12,
	background: "#080b0a",
});

globalStyle("*::-webkit-scrollbar-button", {
	display: "none",
	width: 0,
	height: 0,
});

globalStyle("*::-webkit-scrollbar-track", {
	margin: "2px",
	border: "1px solid #1a2b22",
	background: "#080b0a",
	boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 45%)",
});

globalStyle("*::-webkit-scrollbar-track-piece", {
	background: "#0a0e0c",
});

globalStyle("*::-webkit-scrollbar-thumb", {
	minHeight: 36,
	border: "2px solid #080b0a",
	borderRadius: 0,
	background: "linear-gradient(180deg, #d9a441 0%, #8ba66f 22%, #52745c 100%)",
	boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 16%)",
});

globalStyle("*::-webkit-scrollbar-thumb:hover", {
	background: "linear-gradient(180deg, #f1c862 0%, #a9c38a 22%, #668d70 100%)",
});

globalStyle("*::-webkit-scrollbar-thumb:active", {
	background: "#d9a441",
	boxShadow: "inset 0 0 0 1px #f1c862",
});

globalStyle("*::-webkit-scrollbar-corner", {
	background: "#080b0a",
	border: "1px solid #1a2b22",
});

globalStyle("html, body, #root", {
	minWidth: 320,
	minHeight: "100%",
	margin: 0,
});

globalStyle("body", {
	backgroundColor: "#0c100f",
	color: "#f4f1ea",
});

globalStyle("button, textarea, input", {
	font: "inherit",
});

globalStyle("button:focus-visible, input:focus-visible", {
	outline: "2px solid #d9a441",
	outlineOffset: 2,
});

globalStyle("textarea:focus-visible", {
	outline: "none",
	outlineOffset: 0,
});

globalStyle("::selection", {
	background: "#d9a441",
	color: "#17130c",
});

globalStyle("a", {
	color: "inherit",
});
