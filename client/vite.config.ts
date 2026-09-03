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
	server: {
		proxy: {
			"/tibiawiki-api": {
				target: "https://www.tibiawiki.com.br",
				changeOrigin: true,
				rewrite: (requestPath) => {
					return requestPath.replace(/^\/tibiawiki-api/, "/api.php");
				},
			},
			"/tibiawatch-api": {
				target: "https://api.increasesoft.com",
				changeOrigin: true,
				rewrite: (requestPath) => {
					return requestPath.replace(/^\/tibiawatch-api/, "/api");
				},
			},
		},
	},
});
