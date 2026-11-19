// 解析文章 frontmatter：KMP 查找 --> 结束标记，分行解析 key: value，
// tags 转数组。postName 可选，无 frontmatter 时用作默认 title。
export default function parseFrontmatter(content, postName) {
	if (!content.startsWith("\<!--"))
		return { metadata: { title: postName }, content };

	// kmp 算法
	function getNext(pattern) {
		const next = Array(pattern.length).fill(0)
		for (let i = 1, j = 0; i < pattern.length; i++) {
			while (j > 0 && pattern[i] !== pattern[j]) {
				j = next[j - 1]
			}
			if (pattern[i] === pattern[j]) {
				j++
			}
			next[i] = j
		}
		return next
	}

	const pattern = "--\>";
	const next = getNext(pattern)
	let j = 0
	let endIndex = -1
	for (let i = 0; i < content.length; i++) {
		while (j > 0 && content[i] !== pattern[j]) {
			j = next[j - 1]
		}
		if (content[i] === pattern[j]) {
			j++
		}
		if (j === pattern.length) {
			endIndex = i + 1
			break
		}
	}

	const frontmatter = content.substring(4, endIndex - 3).trim()
	const body = content.substring(endIndex).trim()
	const metadata = {}

	frontmatter.split('\n').forEach(line => {
		const [key, ...values] = line.split(':')
		if (key && values.length) {
			metadata[key.trim()] = values.join(':').trim()
		}
	})

	// convert tags string to array if present
	if (metadata.tags) {
		try {
			// assume JSON-like list
			metadata.tags = JSON.parse(metadata.tags.replace(/'/g, '"'))
		} catch (e) {
			// fallback comma split
			metadata.tags = metadata.tags.replace(/\[|\]/g, '').split(/\s*,\s*/).filter(Boolean)
		}
	}

	return { metadata, content: body }
}
