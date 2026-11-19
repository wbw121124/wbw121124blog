// 搜索高亮工具：SearchPage.vue 与 SearchDPage.vue 共用，避免两页重复实现
// 注意：本模块不持有任何组件状态，query 一律由调用方显式传入

// HTML 转义（与 PostPage.vue 的转义写法保持一致，& 必须放最前避免二次转义）
export function escapeHtml(str) {
	return str.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// 单字符转义：给 highlightByMatches 按字符拼接时用，不改变其余索引逻辑
export function escapeHtmlChar(ch) {
	switch (ch) {
		case '&': return '&amp;';
		case '<': return '&lt;';
		case '>': return '&gt;';
		case '"': return '&quot;';
		case '\'': return '&#39;';
		default: return ch;
	}
}

// 简易高亮：按关键词整体匹配（忽略空格）；query 为空时只做转义不高亮
export function highlight(text, query) {
	if (!text) return '';
	// query 允许为空串/undefined：无关键词时退化为纯转义
	const k = (query || '').trim().replace(/ /g, '');
	if (!k) return escapeHtml(text);
	const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${esc})`, 'gi');
	// 先做 HTML 转义再匹配高亮，防止标题/摘要里的 <、>、& 被浏览器当标签吞掉
	return escapeHtml(text).replace(/ /g, '').replace(regex, '<mark>$1</mark>');
}

// 精确高亮：用 fuse 返回的 matchObj.indices 逐区间打标，与原文索引对齐
export function highlightByMatches(text, matchObj, query) {
	if (!text) return '';
	if (!matchObj || !matchObj.indices || !matchObj.indices.length) {
		// 无精确索引时退化为关键词整体匹配
		return highlight(text, query);
	}
	const chars = Array.from(text);
	const markers = new Array(chars.length).fill(false);
	for (const [s, e] of matchObj.indices) {
		for (let i = s; i <= e && i < markers.length; i++) markers[i] = true;
	}
	let out = '';
	let inMark = false;
	for (let i = 0; i < chars.length; i++) {
		if (markers[i] && !inMark) { out += '<mark>'; inMark = true; }
		if (!markers[i] && inMark) { out += '</mark>'; inMark = false; }
		// 逐字符转义后再拼接：整体先转义会改变长度，导致 match 索引错位
		out += escapeHtmlChar(chars[i]);
	}
	if (inMark) out += '</mark>';
	return out;
}
