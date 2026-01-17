// src/mkd-it.js - Markdown-it 初始化模块
import MarkdownIt from 'markdown-it';
import MarkdownItEmoji from 'markdown-it-emoji/lib/bare.mjs';
import Shiki from '@shikijs/markdown-it'
import MarkdownItFootnote from 'markdown-it-footnote';
import markdownItMath from 'markdown-it-math';
import MarkdownItAnchor from 'markdown-it-anchor';

// 全局markdown-it实例
let mditInstance = null;

export const initMarkdownIt = async () => {
	if (!mditInstance) {
		// Katex 渲染器配置
		const katexOptions = {
			throwOnError: false,
			errorColor: '#cc0000',
			strict: false
		};

		const katexRenderer = {
			inlineRenderer: (str) => {
				try {
					return katex.renderToString(str, {
						...katexOptions,
						displayMode: false
					});
				} catch (error) {
					return `<span style="color: #cc0000">[公式错误: ${error.message}]</span>`;
				}
			},
			blockRenderer: (str) => {
				try {
					return katex.renderToString(str, {
						...katexOptions,
						displayMode: true
					});
				} catch (error) {
					return `<div style="color: #cc0000">[公式错误: ${error.message}]</div>`;
				}
			}
		};

		mditInstance = MarkdownIt({
			html: true,
			linkify: true,
			typographer: true,
			breaks: false
		});
		mditInstance.use(MarkdownItEmoji);
		mditInstance.use(await Shiki({
			themes: {
				light: 'vitesse-light',
				dark: 'vitesse-dark',
			}
		}));
		mditInstance.use(MarkdownItFootnote);
		mditInstance.use(MarkdownItAnchor, {
			permalink: MarkdownItAnchor.permalink.ariaHidden({
				symbol: '¶',
				placement: 'after'
			}),
			slugify: s => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))
		});
		mditInstance.use(markdownItMath, {
			inlineOpen: '$',
			inlineClose: '$',
			blockOpen: '$$',
			blockClose: '$$',
			...katexRenderer
		});
		console.log('Markdown-it initialized');
	}
	return mditInstance;
};