import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		tailwindcss()
	],
	define: {
		process: { env: {} }
	},
	optimizeDeps: {
		include: [
			'markdown-it',
			'markdown-it-math',
			'markdown-it-footnote',
			'markdown-it-anchor',
			'markdown-it-highlightjs',
			'mathup',
			'katex',
			'tailwindcss',
			'highlight.js',
			'markdown-it-emoji'
		],
		exclude: ['vite-ssg', 'vite-router'], // 排除不需要预构建的包
	},
	build: {
		minify: 'terser',
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: {
					markdown: [
						'markdown-it',
						'markdown-it-emoji/lib/bare.mjs',
						'markdown-it-footnote',
						'markdown-it-math',
						'markdown-it-anchor',
						'markdown-it-highlightjs',
						'katex'
					],
				},
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
			}
		},
		cssCodeSplit: true,
		chunkSizeWarningLimit: 1000
	},
	// 设置基础路径，适用于部署到子路径的情况，注意测试时要注释
	base: '/wbw121124blog/'
})
