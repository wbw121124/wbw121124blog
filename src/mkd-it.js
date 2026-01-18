// src/mkd-it.js - Markdown-it 初始化模块
import MarkdownIt from 'markdown-it';
import MarkdownItEmoji from 'markdown-it-emoji/lib/bare.mjs';
import highlightjs from 'markdown-it-highlightjs'
import MarkdownItFootnote from 'markdown-it-footnote';
import markdownItMath from 'markdown-it-math';
import MarkdownItAnchor from 'markdown-it-anchor';
import katex from 'katex';

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
		mditInstance.use(highlightjs);
		mditInstance.use(MarkdownItFootnote);
		mditInstance.use(MarkdownItAnchor, {
			// 自定义 slugify：在 slug 前添加前缀
			slugify: s => {
				const slug = String(s).trim().toLowerCase().replace(/\s+/g, '-');
				return encodeURIComponent(slug);
			},
			// 使用自定义 renderPermalink，把锚点链接设为 GET 查询参数形式（例如 ?anchor=post-xxx）
			permalink: true,
			permalinkSymbol: '¶',
			renderPermalink: (slug, opts, state, idx) => {
				const token = state.tokens[idx + 1];
				if (!token || !token.children) return;
				const text = new state.Token('text', '', 0);
				text.content = ' ';
				const linkOpen = new state.Token('link_open', 'a', 1);
				linkOpen.attrs = [['href', location.href.split('#')[0] + `#${slug}`], ['class', 'header-anchor']];
				const symbol = new state.Token('html_inline', '', 0);
				symbol.content = opts.permalinkSymbol || '¶';
				const linkClose = new state.Token('link_close', 'a', -1);
				token.children.push(text, linkOpen, symbol, linkClose);
			}
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