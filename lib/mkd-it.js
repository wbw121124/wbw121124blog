// src/mkd-it.js - Markdown-it 初始化模块
import MarkdownIt from 'markdown-it';
import MarkdownItEmoji from 'markdown-it-emoji/lib/bare.mjs';
import highlightjs from 'markdown-it-highlightjs'
import MarkdownItFootnote from 'markdown-it-footnote';
import markdownItMath from 'markdown-it-math';
import MarkdownItAnchor from 'markdown-it-anchor';
import highlightLines from './markdown-it-highlight-lines-with-line-numbers.js';
import markdownItMark from 'markdown-it-mark';
import markdownItContainer from 'markdown-it-container';
import katex from 'katex';

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
    const containers = ['info', 'success', 'warning', 'error', 'details'];
    
    containers.forEach(containerType => {
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
                    const summary = title || type || '详细信息';
                    return `<details ${openAttr} class="custom-container custom-container-${type}"><summary>${md.render(summary)}</summary>\n`;
                }
                
                // 结束标签
                 return `</details>\n`;
            }
        });
    });
}

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
		mditInstance.use(markdownItMark);
		mditInstance.use(MarkdownItEmoji);
		setupContainers(mditInstance);
		mditInstance.use(highlightLines);
		mditInstance.use(highlightjs);
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
