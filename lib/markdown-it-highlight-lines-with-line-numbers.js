// 从 https://github.com/egoist/markdown-it-highlight-lines 改编

const RE = /{([\d,-]+)}/

export default md => {
	const fence = md.renderer.rules.fence
	md.renderer.rules.fence = (...args) => {
		const [tokens, idx, options, , self] = args
		const token = tokens[idx]

		// 检查是否有行高亮配置
		const hasLineHighlight = token.info && RE.test(token.info)

		let lineNumbers = null
		let langName = token.info || ''

		if (hasLineHighlight) {
			lineNumbers = RE.exec(token.info)[1]
				.split(',')
				.map(v => v.split('-').map(v => parseInt(v, 10)))
			langName = token.info.replace(RE, '').trim()
		}

		// 获取高亮后的代码
		const code = options.highlight ?
			options.highlight(token.content, langName) :
			token.content

		// 分割代码行，并为每一行添加 class
		const codeSplits = code.split('\n').map((split, index) => {
			const lineNumber = index + 1

			// 检查当前行是否需要高亮
			let isHighlighted = false
			if (hasLineHighlight && lineNumbers) {
				isHighlighted = lineNumbers.some(([start, end]) => {
					if (start && end) {
						return lineNumber >= start && lineNumber <= end
					}
					return lineNumber === start
				})
			}

			// 构建行的 class
			let lineClass = 'code-line'
			if (isHighlighted) {
				lineClass += ' highlighted-line'
			}

			// 返回带 class 的行
			return `<span class="${lineClass}">${split}</span>`
		})

		// 合并所有行
		let highlightedCode = codeSplits.join('\n')

		// 如果自定义高亮器已经包装了 <pre>，直接返回
		if (highlightedCode.startsWith('<pre')) {
			return highlightedCode
		}

		// 构建最终的 pre 和 code 标签
		const tmpToken = {
			attrs: [['class', langName ? `language-${langName}` : '']]
		}
		const attrs = self.renderAttrs(tmpToken)
		return `<pre${attrs}><code${attrs}>${highlightedCode}</code></pre>`
	}
}
