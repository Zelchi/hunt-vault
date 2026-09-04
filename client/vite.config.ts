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
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
			"/tibiawiki-api": {
				target: "https://www.tibiawiki.com.br",
				changeOrigin: true,
				rewrite: (requestPath) => {
					return requestPath.replace(/^\/tibiawiki-api/, "/api.php");
				},
			},
		},
	},
});
