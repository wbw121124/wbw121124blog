// 从 https://github.com/egoist/markdown-it-highlight-lines 改编

import hljs from 'highlight.js'
import { createHighlighter, bundledLanguages } from 'shiki'

// 初始化 Shiki 高亮器
let shikiHighlighter = null;
let shikiReady = false;
const initShiki = createHighlighter({
	themes: ['light-plus', 'dark-plus'],
	langs: Object.keys(bundledLanguages)
}).then(highlighter => {
	shikiHighlighter = highlighter;
	shikiReady = true;
}).catch(err => {
	console.error('Failed to initialize Shiki highlighter:', err);
});

const RE = /{([\d,-]+)}/
const HLJS_FLAG = /\[hljs\]/
const FOCUS = /\/([\d,-]+)\//

function extractNewlines(html) {
	let result = '';
	let stack = [];      // 存储打开的标签名，如 ['span', 'span']
	let i = 0;
	const n = html.length;

	while (i < n) {
		const ch = html[i];
		if (ch === '<') {
			// 解析标签
			const end = html.indexOf('>', i);
			if (end === -1) break;
			const tag = html.slice(i, end + 1);
			if (tag[1] === '/') {
				// 闭合标签，例如 </span>
				const tagName = tag.match(/<\/(\w+)/)[1];
				if (stack.length && stack[stack.length - 1].tag === tagName) {
					stack.pop();
				}
				result += tag;
			} else if (tag.endsWith('/>')) {
				// 自闭合标签（hljs 不会产生，但安全起见）
				result += tag;
			} else {
				// 开标签，例如 <span class="...">
				const tagName = tag.match(/<(\w+)/)[1];
				const classMatch = tag.match(/class="([^"]*)"/);
				const classAttr = classMatch ? ` class="${classMatch[1]}"` : '';
				const styleMatch = tag.match(/style="([^"]*)"/);
				const styleAttr = styleMatch ? ` style="${styleMatch[1]}"` : '';
				stack.push({
					tag: tagName,
					class: classAttr,
					style: styleAttr
				});
				result += tag;
			}
			i = end + 1;
		} else if (ch === '\n') {
			// 遇到换行符，先关闭当前所有打开的标签
			for (let j = stack.length - 1; j >= 0; j--) {
				result += `</${stack[j].tag}>`;
			}
			// 输出换行符
			result += '\n';
			// 重新打开所有标签
			for (let j = 0; j < stack.length; j++) {
				result += `<${stack[j].tag}${stack[j].class}${stack[j].style}>`;
			}
			i++;
		} else {
			// 普通字符
			result += ch;
			i++;
		}
	}

	return result;
}

function wrapLines(processedHtml) {
	return extractNewlines(processedHtml);
}

function highlightWithShikiSync(code, lang) {
	if (!shikiReady || !shikiHighlighter) {
		return highlightWithHljs(code, lang);
	}

	const loadedLanguages = shikiHighlighter.getLoadedLanguages()

	let highlighted
	if (lang && loadedLanguages.includes(lang)) {
		highlighted = shikiHighlighter.codeToHtml(code, {
			lang,
			themes: {
				light: 'light-plus',
				dark: 'dark-plus',
			}
		})
	} else {
		highlighted = shikiHighlighter.codeToHtml(code, {
			lang: 'text',
			themes: {
				light: 'light-plus',
				dark: 'dark-plus',
			}
		})
	}

	// 从 Shiki 生成的 HTML 中提取 <code> 标签内的内容
	const codeMatch = highlighted.match(/<code[^>]*>([\s\S]*?)<\/code>/)
	return codeMatch ? codeMatch[1] : highlighted
}

function highlightWithHljs(code, lang) {
	let highlighted
	if (lang && hljs.getLanguage(lang)) {
		try {
			highlighted = hljs.highlight(code, { language: lang }).value
		} catch (err) {
			console.error(err.message, err.stack)
		}
	} else {
		highlighted = hljs.highlightAuto(code).value
	}
	return highlighted
}

export const isShikiReady = () => {
	return shikiReady;
}

export const initHighlighter = () => {
	return initShiki;
}

export var getShikiHighlighter = () => {
	return shikiHighlighter;
};
// 释放 Shiki 资源（如果需要）
export const disposeShikiHighlighter = () => {
	if (shikiHighlighter || shikiReady) {
		shikiHighlighter.dispose();
		shikiHighlighter = null;
		shikiReady = false;
		console.log("shiki:", shikiHighlighter);
	}
};
export default (md) => {
	const fence = md.renderer.rules.fence
	md.renderer.rules.fence = (...args) => {
		const [tokens, idx, options, , self] = args
		const token = tokens[idx]

		// 去除最后一个换行符
		if (token.content.endsWith('\n')) {
			token.content = token.content.slice(0, -1);
		}

		if (!token.info || !RE.test(token.info)) {
			token.info = (token.info || '') + ' {0}'
		}

		// 检查是否使用 hljs
		const useHljs = HLJS_FLAG.test(token.info)
		// 清理 token.info，移除 [hljs] 标记
		let cleanInfo = token.info.replace(HLJS_FLAG, '').trim()

		let isFocus = false, focusLines = [];

		if (FOCUS.test(token.info)) {
			isFocus = true;
			focusLines = FOCUS.exec(cleanInfo)[1]
				.split(',')
				.map(v => v.split('-').map(v => parseInt(v, 10)));
			cleanInfo = cleanInfo.replace(FOCUS, '').trim();
		}

		const lineNumbers = RE.exec(cleanInfo)[1]
			.split(',')
			.map(v => v.split('-').map(v => parseInt(v, 10)))
		cleanInfo = cleanInfo.replace(RE, '').trim();
		const langName = cleanInfo.split(' ')[0]

		// 根据配置选择高亮器（同步）
		let highlightedCode
		if (!useHljs) {
			const highlighted = highlightWithShikiSync(token.content, langName)
			highlightedCode = wrapLines(highlighted)
		} else {
			const highlighted = highlightWithHljs(token.content, langName)
			highlightedCode = wrapLines(highlighted)
		}

		// 处理行高亮
		const codeSplits = highlightedCode.split('\n').map((split, index) => {
			const lineNumber = index + 1
			function isInRanges(lineNumber, ranges) {
				return ranges.some(([start, end]) => {
					if (start && end) {
						return lineNumber >= start && lineNumber <= end
					}
					return lineNumber === start
				});
			}
			const highlighted = isInRanges(lineNumber, lineNumbers)
			const inFocus = isFocus && isInRanges(lineNumber, focusLines)
			let code = !useHljs ? split.replace(/^<span class="line">/, '').replace(/<\/span>$/, '') : split;
			let className = ['line'];
			if (highlighted) {
				className.push('highlighted-line');
			}
			if (inFocus) {
				className.push('focus');
			}
			return {
				code: `<span class="${className.join(' ')}">${code}</span>`
			}
		})

		let finalCode = ''
		codeSplits.forEach(split => {
			finalCode += split.code
		})

		// 如果高亮器已经包裹了 pre 标签，直接返回
		if (finalCode.startsWith('<pre')) {
			return finalCode
		}

		const tmpToken = {
			attrs: [
				['class',
					[langName ? `language-${langName}` : '',
					!useHljs ? 'shiki' : 'hljs',
					isFocus ? 'use-focus' : ''].filter(Boolean).join(' ')
				],
				['code-language', langName || '']
			]
		}
		const attrs = self.renderAttrs(tmpToken)
		return `<pre ${attrs}><code ${attrs}>${finalCode}</code></pre>`
	}
}