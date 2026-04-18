// 从 https://github.com/egoist/markdown-it-highlight-lines 改编

import hljs from 'highlight.js'

const RE = /{([\d,-]+)}/

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
				if (stack.length && stack[stack.length - 1] === tagName) {
					stack.pop();
				}
				result += tag;
			} else if (tag.endsWith('/>')) {
				// 自闭合标签（hljs 不会产生，但安全起见）
				result += tag;
			} else {
				// 开标签，例如 <span class="...">
				const tagName = tag.match(/<(\w+)/)[1];
				stack.push(tagName);
				result += tag;
			}
			i = end + 1;
		} else if (ch === '\n') {
			// 遇到换行符，先关闭当前所有打开的标签
			for (let j = stack.length - 1; j >= 0; j--) {
				result += `</${stack[j]}>`;
			}
			// 输出换行符
			result += '\n';
			// 重新打开所有标签
			for (let j = 0; j < stack.length; j++) {
				result += `<${stack[j]}>`;
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

function wrapLines(processedHtml, lineNumbers) {
	// 第一次调用（在 highlight 内部）时 lineNumbers 为 undefined，只提取换行符
	if (!lineNumbers) {
		return extractNewlines(processedHtml);
	}
	// 第二次调用（fence 内部）时 lineNumbers 有值，但我们不需要再处理
	// 因为 fence 会自己 split 并包装，所以直接返回原字符串
	return processedHtml;
}

function highlight(code, lang) {
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
	return wrapLines(highlighted)
}

export default md => {
	const fence = md.renderer.rules.fence
	md.renderer.rules.fence = (...args) => {
		const [tokens, idx, options, , self] = args
		const token = tokens[idx]

		if (!token.info || !RE.test(token.info)) {
			return fence(...args)
		}

		const lineNumbers = RE.exec(token.info)[1]
			.split(',')
			.map(v => v.split('-').map(v => parseInt(v, 10)))
		const langName = token.info.replace(RE, '').trim()

		const code = highlight(token.content, langName)
		console.log(code);
		const codeSplits = code.split('\n').map((split, index) => {
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
		let highlightedCode = ''
		codeSplits.forEach(split => {
			highlightedCode += split.code
		})
		// If custom highlighter wraps code with starting <pre..., don't wrap code
		if (highlightedCode.startsWith('<pre')) {
			return highlightedCode
		}
		const tmpToken = {
			attrs: [['class', langName ? `language-${langName}` : '']]
		}
		const attrs = self.renderAttrs(tmpToken)
		return `<pre${attrs}><code${attrs}>${highlightedCode}</code></pre>`
	}
}
