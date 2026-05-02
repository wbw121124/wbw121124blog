// src/mkd-it.js - Markdown-it 初始化模块
import MarkdownIt from 'markdown-it';
import MarkdownItEmoji from 'markdown-it-emoji/lib/bare.mjs';
import MarkdownItFootnote from 'markdown-it-footnote';
import markdownItMath from 'markdown-it-math';
import MarkdownItAnchor from 'markdown-it-anchor';
import Shiki from '@shikijs/markdown-it';
import markdownItMark from 'markdown-it-mark';
import markdownItContainer from 'markdown-it-container';
import katex from 'katex';
import 'katex/contrib/mhchem';
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets';
import markdownItWrapperlessFenceRule from '@olets/markdown-it-wrapperless-fence-rule';
import {
	transformerNotationDiff,
	transformerNotationHighlight,
	transformerNotationFocus,
	transformerNotationErrorLevel,
	// transformerRenderWhitespace, // aaaa 有 bug
	transformerMetaHighlight,
	transformerMetaWordHighlight,
	transformerRemoveLineBreak,
	transformerRemoveNotationEscape,
	transformerNotationWordHighlight
} from '@shikijs/transformers';
import { transformerTwoslash } from '@shikijs/twoslash';
import renderA11yString from 'katex/contrib/render-a11y-string';

// 全局markdown-it实例
let mditInstance = null;

// 辅助函数：解析容器标记中的标题和参数
// 输入: "info[我是标题]{open}" 或 "success[标题]"
// 输出: { type: 'info', title: '我是标题', openAttr: 'open' }
function parseContainerInfo(info) {
	const match = info.match(/^(\w+)[ \t]*(?:\[(.*?)\])?[ \t]*(?:\{(.*?)\})?/);
	if (!match) return { type: info, title: null, openAttr: '' };

	let [, type, title, params] = match;
	// 检查是否包含 open 参数
	const openAttr = params && params.includes('open') ? 'open' : '';

	return { type, title: title || null, openAttr };
}

function setupContainers(md) {
	// 支持的容器类型列表
	const containers = [
		['info', '信息'],
		['success', '成功'],
		['warning', '警告'],
		['error', '错误'],
		['details', '详情'],
		['danger', '危险']];

	containers.forEach(c => {
		const containerType = c[0];
		const name = c.length > 1 ? c[1] : null;
		md.use(markdownItContainer, containerType, {
			// 验证函数：确保标记以容器类型开头
			validate(params) {
				return params.trim().startsWith(containerType);
			},

			// 渲染函数
			render(tokens, idx) {
				const token = tokens[idx];
				const info = token.info.trim();
				const { type, title, openAttr } = parseContainerInfo(info);

				// 开始标签
				if (token.nesting === 1) {
					const summary = title || name || type || '详细信息';
					return `<details ${openAttr} class="custom-container custom-container-${type}"><summary>${md.render(summary).replace('<p>', '').replace('</p>', '')}</summary>\n`;
				}

				// 结束标签
				return `</details>\n`;
			}
		});
	});
}
export const disposeMarkdownIt = () => {
	mditInstance = null;
}
export const initMarkdownIt = async () => {
	if (!mditInstance) {
		// Katex 渲染器配置
		const katexOptions = {
			throwOnError: false,
			errorColor: '#cc0000',
			strict: false,
			macros: {
				// 定义一个 \resetcolor 宏，等同于切换到 var(--text-color)
				"\\resetcolor": "\\htmlClass{reset-color}"
			},
			trust: (context) => {
				// 1. 允许 htmlClass 和 htmlStyle 命令
				if (context.command === '\\htmlClass' || context.command === '\\htmlStyle') {
					return true;
				}

				// 2. 对于 URL 类命令（如 \href），需校验协议
				if (context.command === '\\href' || context.command === '\\url') {
					const protocol = context.protocol?.toLowerCase();
					// 允许列表：仅放行 http, https, mailto, ftp 等安全协议
					const allowedProtocols = ['http:', 'https:', 'mailto:', 'ftp:'];
					return allowedProtocols.includes(protocol);
				}

				// 3. 默认拒绝其他命令
				return false;
			},
		};

		function escapeA11yText(text) {
			if (!text) return '';
			return text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
		}
		function getSafeA11yLabel(latexStr, katex, options) {
			try {
				const label = renderA11yString(latexStr, katex, options);
				if (label.includes('not implemented') || label.includes('error')) {
					return `数学公式: ${latexStr.substring(0, 100)}`;
				}
				return label;
			} catch (error) {
				console.warn('生成无障碍文本失败:', error);
				return `数学公式: ${latexStr.substring(0, 100)}`;
			}
		}
		const katexRenderer = {
			inlineRenderer: (str) => {
				try {
					const html = katex.renderToString(str, {
						...katexOptions,
						displayMode: false
					});
					const a11yText = getSafeA11yLabel(str, katex, katexOptions);
					return `<span tabindex="0" role="text" aria-label="${escapeA11yText(a11yText)}">${html}</span>`;
				} catch (error) {
					return `<span style="color: #cc0000">[公式错误: ${error.message}]</span>`;
				}
			},
			blockRenderer: (str) => {
				try {
					const html = katex.renderToString(str, {
						...katexOptions,
						displayMode: true
					});
					const a11yText = getSafeA11yLabel(str, katex, katexOptions);
					return `<span tabindex="0" role="text" style="overflow-x: auto;" aria-label="${escapeA11yText(a11yText)}">${html}</span>`;
				} catch (error) {
					return `<span style="color: #cc0000" class="katex-error katex-display">[公式错误: ${error.message}]</span>`;
				}
			}
		};

		mditInstance = MarkdownIt({
			html: true,
			linkify: true,
			typographer: true,
			breaks: false
		});
		// mditInstance.renderer.rules.fence = markdownItWrapperlessFenceRule;
		mditInstance.use(markdownItMark);
		mditInstance.use(MarkdownItEmoji);
		setupContainers(mditInstance);
		mditInstance.use(await Shiki({
			themes: {
				light: 'light-plus',
				dark: 'dark-plus',
			},
			transformers: [
				transformerColorizedBrackets(),
				transformerNotationDiff({
					matchAlgorithm: 'v3',
				}),
				transformerNotationHighlight({
					matchAlgorithm: 'v3',
				}),
				transformerNotationFocus({
					matchAlgorithm: 'v3',
				}),
				transformerNotationErrorLevel({
					matchAlgorithm: 'v3',
				}),
				transformerMetaHighlight({
					matchAlgorithm: 'v3',
				}),
				transformerMetaWordHighlight({
					matchAlgorithm: 'v3',
				}),
				transformerRemoveLineBreak({
					matchAlgorithm: 'v3',
				}),
				transformerRemoveNotationEscape({
					matchAlgorithm: 'v3',
				}),
				transformerNotationWordHighlight({
					matchAlgorithm: 'v3',
				}),
				// transformerRenderWhitespace({
				// 	matchAlgorithm: 'v3',
				// 	position: 'all',
				// }),
				{
					code(node) {
						if (!node.properties.class) return

						// class 可能是 string 或 string[]
						const classes = Array.isArray(node.properties.class)
							? node.properties.class
							: String(node.properties.class).split(' ')

						// 找到 language-* 这个 class
						const langClass = classes.find(c => c.startsWith('language-'))

						if (langClass) {
							const lang = langClass.replace('language-', '')

							// 设置为自定义属性
							node.properties['code-language'] = lang
						}
					}
				},
				// This is for normal TypeScript Twoslash
				transformerTwoslash({
					disableTriggers: ['notwoslash', 'no-twoslash'],
					rendererRich: {
						// Use hover to render errors instead of inserting a error line
						// Up to your preference
						errorRendering: 'hover',
					},
				}),
			]
		}));
		mditInstance.use(MarkdownItFootnote);
		mditInstance.use(MarkdownItAnchor, {
			// 自定义 slugify：在 slug 前添加前缀
			slugify: s => {
				const slug = String(s).trim().toLowerCase().replace(/\s+/g, '-');
				return encodeURIComponent(slug);
			},
			// 使用自定义 renderPermalink，把锚点链接设为 锚点链接
			permalink: true,
			permalinkSymbol: '¶',
			renderPermalink: (slug, opts, state, idx) => {
				const token = state.tokens[idx + 1];
				if (!token || !token.children) return;
				const text = new state.Token('text', '', 0);
				text.content = ' ';
				const linkOpen = new state.Token('link_open', 'a', 1);
				const hrefBase = typeof location !== 'undefined' && location.href ? location.href.split('#')[0] : '';
				linkOpen.attrs = [['href', `${hrefBase}#${slug}`], ['class', 'header-anchor']];
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
