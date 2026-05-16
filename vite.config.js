import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { rp2h } from './scripts/rp2h.js'
import { resolve } from 'path';
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import { FontaineTransform } from 'fontaine';

const fontaineOptions = {
	fallbacks: {
		'Fira Code': [
			'JetBrains Mono',
			'Cascadia Code',
			'Source Code Pro',
			'Hack',
			'Fira Mono',
			'Roboto Mono',
			'Courier New',
			'Liberation Mono',
			'monospace'
		],
		'Fira Code VF': [
			'JetBrains Mono',
			'Cascadia Code',
			'Source Code Pro',
			'Hack',
			'Fira Mono',
			'Roboto Mono',
			'Courier New',
			'Liberation Mono',
			'monospace'
		],
		// 'KaTeX_Main': ['Times New Roman', 'Georgia', 'serif'],
		// 'KaTeX_SansSerif': ['Arial', 'sans-serif'],
		// 'KaTeX_Typewriter': ['Courier New', 'monospace'],
		// 'KaTeX_Math': ['Times New Roman', 'Georgia', 'serif'],
		// 'KaTeX_Caligraphic': ['cursive'],
		// 'KaTeX_Fraktur': ['Georgia', 'Times New Roman', 'serif'],
		// 'KaTeX_Script': ['cursive'],
		// 'KaTeX_AMS': ['Times New Roman', 'Arial', 'sans-serif'],
		// 'KaTeX_Size1': ['DejaVu Sans', 'Arial', 'sans-serif'],
		// 'KaTeX_Size2': ['DejaVu Sans', 'Arial', 'sans-serif'],
		// 'KaTeX_Size3': ['DejaVu Sans', 'Arial', 'sans-serif'],
		// 'KaTeX_Size4': ['DejaVu Sans', 'Arial', 'sans-serif'],
	},
	resolvePath: (id) => {
		// id 会是 'woff2/FiraCode.woff2' 这样的值
		// 拼接成完整的文件系统路径
		const fullPath = resolve(__dirname, 'src/styles', id);
		console.log(`${id}:${fullPath}`);
		return fullPath;
	},
	// 如果是 KaTeX 的字体，直接跳过，不要生成 override
	skipFontFaceGeneration: (fallbackName) => {
		// 如果检测到是 KaTeX 的字体，返回 true 以跳过
		return fallbackName.includes('KaTeX');
	}
}

console.log(`process.env.NODE_ENV: ${process.env.NODE_ENV}, ${process.env.NODE_ENV === 'production' ? false : true}`);

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		AutoImport({
			imports: ['vue'],
			resolvers: [
				ElementPlusResolver(),
				IconsResolver({
					prefix: 'Icon',
				}),
			],
		}),
		Components({
			resolvers: [
				ElementPlusResolver(),
				// 自动注册图标组件
				IconsResolver({
					enabledCollections: ['ep'], // Element Plus 图标
				}),
			],
		}),
		{
			name: 'wbw-hmr-handler',
			handleHotUpdate({ file, server }) {
				console.log(`File changed: ${file}`);
				// 当 posts 文件夹变化时重新构建，注意**不能**是 posts-html、postlist.json、statistics.json、tags.json，因为它是输出的文件（夹）
				if (file.includes('/posts/')) {
					// 当特定文件变化时执行自定义逻辑
					console.log(`${file}: Detected change, rebuilding posts...`);
					// 执行你的自定义脚本
					rp2h([file]).then(() => {
						console.log('Posts rebuilt on HMR');
					});
				}
				// 返回 void 或模块数组来控制热更新行为
				// 返回 undefined 表示使用默认行为
			}
		},
		Icons({
			autoInstall: true,
			scale: 1,
			defaultClass: 'inline-block',
			compiler: 'vue3',
		}),
		FontaineTransform.vite(fontaineOptions),
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
		// 只有 preview 时才 sourcemap: true
		sourcemap: process.env.NODE_ENV === 'production' ? false : true,
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
		devSourcemap: process.env.NODE_ENV === 'production' ? false : true,
	},
	// 设置基础路径，适用于部署到子路径的情况，注意测试时要注释
	base: '/wbw121124blog/',
})
