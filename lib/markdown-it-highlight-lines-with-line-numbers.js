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

    // 先对原始代码进行行包裹，再进行语法高亮
    const originalCode = token.content
    const codeLines = originalCode.split('\n')
    
    // 为每一行原始代码添加标记占位符
    const linesWithMarkers = codeLines.map((line, index) => {
      const lineNumber = index + 1
      let isHighlighted = false
      
      if (hasLineHighlight && lineNumbers) {
        isHighlighted = lineNumbers.some(([start, end]) => {
          if (start && end) {
            return lineNumber >= start && lineNumber <= end
          }
          return lineNumber === start
        })
      }
      
      // 使用唯一标记，后续替换
      const highlightClass = isHighlighted ? 'highlighted-line' : ''
      return `__CODE_LINE_START__${lineNumber}__${highlightClass}__${line}__CODE_LINE_END__`
    })
    
    // 重新组合带标记的代码
    const codeWithMarkers = linesWithMarkers.join('\n')
    
    // 对带标记的代码进行语法高亮
    const highlightedCode = options.highlight ? 
      options.highlight(codeWithMarkers, langName) : 
      codeWithMarkers
    
    // 将高亮后的标记替换为实际的 span 标签
    const finalCode = highlightedCode.replace(
      /__CODE_LINE_START__(\d+)__([^_]*)__(.*?)__CODE_LINE_END__/gs,
      (match, lineNum, highlightClass, content) => {
        const classAttr = highlightClass ? `code-line ${highlightClass}` : 'code-line'
        return `<span class="${classAttr}">${content}</span>`
      }
    )
    
    // 如果自定义高亮器已经包装了 <pre>，直接返回
    if (finalCode.startsWith('<pre')) {
      return finalCode
    }
    
    // 构建最终的 pre 和 code 标签
    const tmpToken = {
      attrs: [['class', langName ? `language-${langName}` : '']]
    }
    const attrs = self.renderAttrs(tmpToken)
    return `<pre${attrs}><code${attrs}>${finalCode}</code></pre>`
  }
}
