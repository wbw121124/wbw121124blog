import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { rp2h } from './scripts/rp2h.js'
import { resolve } from 'path';
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		tailwindcss(),
		AutoImport({
			imports: ['vue'],
			resolvers: [
				ElementPlusResolver(),
			],
		}),
		Components({
			resolvers: [
				ElementPlusResolver(),
			],
		}),
		{
			name: 'custom-hmr-handler',
			handleHotUpdate({ file, server }) {

				// 当 posts 文件夹变化时重新构建
				if (file.includes('/posts/')) {
					// 当特定文件变化时执行自定义逻辑
					console.log(`File changed: ${file}`);
					// 执行你的自定义脚本
					rp2h().then(() => {
						console.log('Posts rebuilt on HMR');
					});
				}

				// 返回 void 或模块数组来控制热更新行为
				// 返回 undefined 表示使用默认行为
			}
		},
	],
	define: {
		process: { env: {} }
	},
	optimizeDeps: {
		include: [
			// 'markdown-it',
			// 'markdown-it-math',
			// 'markdown-it-footnote',
			// 'markdown-it-anchor',
			// 'markdown-it-highlightjs',
			// 'mathup',
			// 'katex',
			'tailwindcss',
			// 'highlight.js',
			// 'markdown-it-emoji',
			"element-plus",
			'vue',
			'fuse.js',
		],
		exclude: ['vite-ssg', 'vite-router'], // 排除不需要预构建的包
	},
	build: {
		minify: 'terser',
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					// markdown: [
					// 	'markdown-it',
					// 	'markdown-it-emoji/lib/bare.mjs',
					// 	'markdown-it-footnote',
					// 	'markdown-it-math',
					// 	'markdown-it-anchor',
					// 	'markdown-it-highlightjs',
					// 	'katex'
					// ],
				},
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
			},
			input: {
				main: resolve(__dirname, 'index.html'),
				notFound: resolve(__dirname, '404.html')
			}
		},
		cssCodeSplit: true,
		chunkSizeWarningLimit: 1024
	},
	// 设置基础路径，适用于部署到子路径的情况，注意测试时要注释
	base: '/wbw121124blog/'
})
