import { style } from "@vanilla-extract/css";
import type { JSX } from "solid-js";

export const toast = style({
	fontFamily: '"Courier New", ui-monospace, SFMono-Regular, Consolas, monospace',
	fontSize: "0.78rem",
	fontWeight: 700,
	letterSpacing: "0.02em",
	lineHeight: 1.4,
});

export const toastInlineStyle: JSX.CSSProperties = {
	background: "#121816",
	border: "1px solid #2b4638",
	"border-radius": 0,
	"box-shadow": "4px 4px 0 #050706",
	color: "#f4f1ea",
	"max-width": "min(22rem, calc(100vw - 2rem))",
	padding: "0.75rem 0.85rem",
};
