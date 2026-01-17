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
			'@shikijs/markdown-it',
			'markdown-it-katex-ex',
			'markdown-it-footnote',
			'markdown-it-anchor'
		],
		exclude: ['vite-ssg'] // 排除不需要预构建的包
	},
	build: {
		minify: 'terser',
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: {
					vue: ['vue', 'vue-router'],
					markdown: ['markdown-it', '@shikijs/markdown-it', 'markdown-it-katex', 'markdown-it-footnote', 'markdown-it-anchor']
				},
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
			}
		},
		cssCodeSplit: true,
		chunkSizeWarningLimit: 1000
	}
})
