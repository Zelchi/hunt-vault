import path from "node:path";

import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const projectDirectory = import.meta.dirname;

export default defineConfig({
	plugins: [solid()],
	resolve: {
		alias: {
			"@": path.resolve(projectDirectory, "src"),
		},
	},
});
