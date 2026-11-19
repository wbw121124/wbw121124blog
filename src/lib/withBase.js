// 站内路径拼接：把站内相对路径与构建 base 组合成可用的 URL
// 双部署 base 不同（CF 根路径 / GitHub Pages 子路径），所有站内链接与 fetch 必须经此函数
export function withBase(p) {
	if (!p) return p;
	// 外部链接与 data: 协议原样返回
	if (/^(https?:)?\/\//.test(p) || p.startsWith('data:') || p.startsWith('mailto:')) return p;
	const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
	return `${base}/${String(p).replace(/^\/+/, '')}`;
}
