// 从 https://github.com/egoist/markdown-it-highlight-lines 改编

import hljs from 'highlight.js'
import { createHighlighter, bundledLanguages } from 'shiki'

let shikiHighlighter = null
let shikiReady = false

// 同步初始化 Shiki（在模块加载时就开始）
const shikiInitPromise = createHighlighter({
	themes: ['github-dark', 'github-light'],
	langs: Object.keys(bundledLanguages)
}).then(highlighter => {
	shikiHighlighter = highlighter
	shikiReady = true
	return highlighter
})

const RE = /{([\d,-]+)}/
const SHIKI_FLAG = /\[shiki\]/

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
		// Shiki 还未准备好，返回纯文本
		// return code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
	}

	const loadedLanguages = shikiHighlighter.getLoadedLanguages()

	let highlighted
	if (lang && loadedLanguages.includes(lang)) {
		highlighted = shikiHighlighter.codeToHtml(code, {
			lang,
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			}
		})
	} else {
		highlighted = shikiHighlighter.codeToHtml(code, {
			lang: 'text',
			themes: {
				light: 'github-light',
				dark: 'github-dark',
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
			highlighted = hljs.highlight(code).value
		}
	} else {
		highlighted = hljs.highlight(code).value
	}
	return highlighted
}

export default (md) => {
	const fence = md.renderer.rules.fence
	md.renderer.rules.fence = (...args) => {
		const [tokens, idx, options, , self] = args
		const token = tokens[idx]

		if (!token.info || !RE.test(token.info)) {
			token.info = (token.info || '') + ' {0}'
		}

		// 检查是否使用 hljs
		const useShiki = SHIKI_FLAG.test(token.info)
		// 清理 token.info，移除 [hljs] 标记
		const cleanInfo = token.info.replace(SHIKI_FLAG, '').trim()

		const lineNumbers = RE.exec(cleanInfo)[1]
			.split(',')
			.map(v => v.split('-').map(v => parseInt(v, 10)))
		const langName = cleanInfo.replace(RE, '').trim()

		// 根据配置选择高亮器（同步）
		let highlightedCode
		if (useShiki) {
			const highlighted = highlightWithShikiSync(token.content, langName)
			highlightedCode = wrapLines(highlighted)
		} else {
			const highlighted = highlightWithHljs(token.content, langName)
			highlightedCode = wrapLines(highlighted)
		}

		// 处理行高亮
		const codeSplits = highlightedCode.split('\n').map((split, index) => {
			const lineNumber = index + 1
			const inRange = lineNumbers.some(([start, end]) => {
				if (start && end) {
					return lineNumber >= start && lineNumber <= end
				}
				return lineNumber === start
			})
			if (inRange) {
				return {
					code: `<span class="code-line highlighted-line">${split}</span>`
				}
			}
			return {
				code: `<span class="code-line">${split}</span>`
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
				['class', (langName ? `language-${langName}` : '') +
					(useShiki ? ' shiki' : 'hljs')],
			]
		}
		const attrs = self.renderAttrs(tmpToken)
		return `<pre${attrs}><code${attrs}>${finalCode}</code></pre>`
	}

	// 返回一个 Promise，确保 Shiki 初始化完成
	return shikiInitPromise.then(() => md)
}