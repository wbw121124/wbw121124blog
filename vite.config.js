import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { rp2h } from './scripts/rp2h.js'
import { resolve } from 'path';
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import postcssNesting from 'postcss-nesting'
import autoprefixer from 'autoprefixer'

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
			name: 'wbw-hmr-handler',
			handleHotUpdate({ file, server }) {
				console.log(`File changed: ${file}`);
				// 当 posts 文件夹变化时重新构建，注意**不能**是 posts-html、postlist.json、statistics.json、tags.json，因为它是输出的文件（夹）
				if (file.includes('/posts/') ||
					file.includes('scripts/rp2h.js') ||
					file.includes('lib/cast.js') ||
					file.includes('lib/mkd-it.js') ||
					file.includes('lib/markdown-it-highlight-lines-with-line-numbers.js') ||
					file.includes('vite.config.js')) {
					// 当特定文件变化时执行自定义逻辑
					console.log(`${file}: Detected change, rebuilding posts...`);
					// 执行你的自定义脚本
					rp2h([file]).then(() => {
						console.log('Posts rebuilt on HMR');
					});
				}
				// 返回 void 或模块数组来控制热更新行为
				// 返回 undefined 表示使用默认行为
			},
			// onFileChange(file) {
			// 	console.log(`File changed: ${file}`);
			// 	// 当 posts 文件夹变化时重新构建，注意**不能**是 posts-html、postlist.json、statistics.json、tags.json，因为它是输出的文件（夹）
			// 	if (file.includes('/posts/') ||
			// 		file.includes('scripts/rp2h.js') ||
			// 		file.includes('lib/cast.js') ||
			// 		file.includes('lib/mkd-it.js') ||
			// 		file.includes('lib/markdown-it-highlight-lines-with-line-numbers.js') ||
			// 		file.includes('vite.config.js')) {
			// 		// 当特定文件变化时执行自定义逻辑
			// 		console.log(`${file}: Detected change, rebuilding posts...`);
			// 		// 执行你的自定义脚本
			// 		rp2h([file]).then(() => {
			// 			console.log('Posts rebuilt on HMR');
			// 		});
			// 	}
			// 	// 返回 void 或模块数组来控制热更新行为
			// 	// 返回 undefined 表示使用默认行为
			// }
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
	css: {
		postcss: {
			plugins: [
				postcssNesting(),
				autoprefixer()
			]
		}
	},
	// 设置基础路径，适用于部署到子路径的情况，注意测试时要注释
	base: '/wbw121124blog/'
})
