import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "node:path";

export default defineConfig({
	plugins: [vanillaExtractPlugin(), solid()],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "src"),
		},
	},
});
