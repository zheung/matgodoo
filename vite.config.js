import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vite';
import pluginVue from '@vitejs/plugin-vue';
import pluginLegacy from '@vitejs/plugin-legacy';


const dirProject = dirname(fileURLToPath(import.meta.url));


export default defineConfig({
	plugins: [
		pluginVue({
			template: {
				compilerOptions: {
					isCustomElement: tag => /^((module-|comp-|p-).+?|module)$/.test(tag)
				}
			}
		}),
		pluginLegacy({ targets: ['defaults', 'not IE 11'] })
	],
	root: resolve(dirProject, 'app'),
	base: './',
	build: {
		outDir: resolve(dirProject, 'dist'),
		emptyOutDir: true,
		chunkSizeWarningLimit: 1024
	},
	clearScreen: false,
	server: {
		port: 4757,
	}
});