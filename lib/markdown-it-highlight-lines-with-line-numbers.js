// 从 https://github.com/egoist/markdown-it-highlight-lines 改编
import hljs from 'highlight.js'

const RE = /{([\d,-]+)}/

function highlight(code, lang) {
	if (lang && hljs.getLanguage(lang)) {
		try {
			return hljs.highlight(code, { language: lang }).value;
		} catch (err) {
			console.error(err.message, err.stack);
		}
	}
	return hljs.highlight(code).value;
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
		return `<pre${attrs}><code${attrs}>${highlightedCode.trim()}</code></pre>`
	}
}
