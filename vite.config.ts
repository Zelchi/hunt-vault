import path from "node:path";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
	plugins: [vanillaExtractPlugin(), solid()],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "src"),
		},
	},
});
