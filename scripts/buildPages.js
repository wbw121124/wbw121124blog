#!/usr/bin/env node
/**
 * buildPages.js —— 全站静态页面生成器
 *
 * 职责：
 * 	在 `vite build` 完成后执行（由 package.json 的 build / build:gh 串联调用），
 * 	读取构建产物中的数据文件，为每个路由生成独立的 `<路径>/index.html`，
 * 	使每个路由都有真实静态文件（配合 Workers Assets / GitHub Pages 的目录索引规则）。
 *
 * 双变体规则：
 * 	- 默认（CF 变体）：输出目录 dist/，canonical 站点 https://wbw121124.dpdns.org，base 为 /
 * 	- GH_PAGES=1（GH 变体）：输出目录 dist-gh/（生成前先整目录强删旧产物），
 * 		canonical 站点 https://wbw121124.github.io，base 为 /wbw121124blog/
 *
 * 数据来源（由 rp2h.js 预先产出到 public/、vite 构建时拷入产物目录）：
 * 	- <outDir>/postlist.json: { posts: [{ id, title, date, tags, summary }, ...] }（已按日期降序）
 * 	- <outDir>/tags.json:     { tags: { <标签名>: <计数>, ... } }
 *
 * 与 rp2h.js 的关系：rp2h 负责 markdown → html/数据（postlist.json、tags.json），
 * 本脚本只消费这两个数据文件做"一个路由一个 index.html"的静态化，不做任何 markdown 渲染。
 *
 * 页面清单：
 * 	- /（根 index.html 原地改写）
 * 	- /about/、/contact/、/archive/、/tags/、/search/、/searchd/
 * 	- /post/<encodeURIComponent(id)>/（每篇文章）
 * 	- /tag/<encodeURIComponent(tagName)>/（每个标签一页）
 * 	- /posts/<year>/（每篇文章 date 前 4 位去重）
 * 	- 404 页使用产物根已有的 404.html（Workers Assets not_found_handling=404-page），不在此生成
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

// 双变体配置：GH_PAGES=1 时输出 dist-gh，站点与 base 换成 GitHub Pages 的
const isGh = process.env.GH_PAGES === '1';
const outDir = isGh ? 'dist-gh' : 'dist';
const siteUrl = isGh ? 'https://wbw121124.github.io' : 'https://wbw121124.dpdns.org';
const base = isGh ? '/wbw121124blog/' : '/';

// 明确报错并置退出码 1（不静默生成空站）
function fail(message) {
	console.error(`[buildPages] 错误：${message}`);
	process.exitCode = 1;
}

// 读取 JSON 数据文件，失败时报错并返回 null
function readJson(file) {
	try {
		return JSON.parse(readFileSync(file, 'utf-8'));
	} catch (err) {
		fail(`读取 ${file} 失败：${err.message}`);
		return null;
	}
}

// HTML 属性值转义：& 必须最先替换避免二次转义；summary 含双引号时不转义会破坏属性；
// 换行折叠为空格，保证 meta 标签单行（属性值内的换行虽合法但破坏可读性）
function escapeHtmlAttr(value) {
	return String(value)
		.replace(/\r?\n+/g, ' ')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// 拼接 canonical：siteUrl + base + 路径，合并 base 尾部与路径头部的重复 /
function canonicalFor(routePath) {
	return siteUrl + base.replace(/\/+$/, '') + '/' + routePath.replace(/^\/+/, '');
}

// 路由数据嵌入 <html> 的 data-route 属性：JSON 序列化后做 HTML 属性转义（引号会破坏属性结构）
// 不用内联 <script> 注入：CSP script-src 'self'（无 unsafe-inline）会拦截内联脚本，前端 main.js 从 dataset 读取
function routeAttr(value) {
	return escapeHtmlAttr(JSON.stringify(value));
}

// 幂等剥离：根页面是"原地更新"，若对已注入过的产物重跑本脚本，先移除上次注入的行，
// 避免重复叠加 og/canonical/description/__ROUTE__。模板自带的标签（title 前的 description 等）不受影响。
function stripInjected(html) {
	let passedTitle = false;
	return html.split('\n').filter((line) => {
		if (/<title[^>]*>/i.test(line)) passedTitle = true;
		// 兼容剥离旧版本内联 script 方式注入的 __ROUTE__（对未重建的旧产物幂等）
		if (/<script>window\.__ROUTE__ = /.test(line)) return false;
		if (/<meta\s+property="og:(title|type|url)"/.test(line)) return false;
		if (/<link\s+rel="canonical"/.test(line)) return false;
		// 仅剥离 title 之后由本脚本注入的 description，保留模板自带的（在 title 之前）
		if (passedTitle && /<meta\s+name="description"/i.test(line)) return false;
		return true;
	}).join('\n');
}

// 基于产物模板生成单页 HTML，两处差异：
// 	a) head 增强：<title> 内容改为页面标题（keepTitle 为 true 时保持原标题，根页用），
// 		并在其后插入 og:*/canonical/description（hasExistingDescription 为 true 时跳过 description，模板已有）
// 	b) 路由数据注入：<html> 标签追加 data-route 属性（props 与 path 均用未编码的原始值，前端直接使用）
// 	routePath 为编码后的 URL 路径（canonical / og:url 用），rawPath 为原始路径（data-route 的 path 用）
function buildPage(template, { routePath, rawPath = routePath, component, props, title, ogType, description, keepTitle = false, hasExistingDescription = false }) {
	const canonical = canonicalFor(routePath);
	const metaLines = [
		`\t<meta property="og:title" content="${escapeHtmlAttr(title)}">`,
		`\t<meta property="og:type" content="${ogType}">`,
		`\t<meta property="og:url" content="${escapeHtmlAttr(canonical)}">`,
		`\t<link rel="canonical" href="${escapeHtmlAttr(canonical)}">`,
	];
	if (!hasExistingDescription) {
		metaLines.push(`\t<meta name="description" content="${escapeHtmlAttr(description)}">`);
	}
	const headBlock = metaLines.join('\n');
	const routeJson = routeAttr({ component, props, path: rawPath });

	let html = template;
	// head 增强：<title> 标签存在则替换内容并在其后插入；不存在则构造完整 title 行插入 <head> 开头
	const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
	const titleMatch = html.match(titleRegex);
	if (titleMatch) {
		const newTitle = keepTitle ? titleMatch[0] : `<title>${escapeHtmlAttr(title)}</title>`;
		html = html.replace(titleRegex, `${newTitle}\n${headBlock}`);
	} else {
		html = html.replace(/<head[^>]*>/i, (m) => `${m}\n\t<title>${escapeHtmlAttr(title)}</title>\n${headBlock}`);
	}
	// 路由数据注入：<html> 标签追加 data-route 属性（先剥离已存在的属性，保证幂等）
	if (/<html[^>]*>/i.test(html)) {
		html = html.replace(/<html([^>]*)>/i, (m, attrs) => {
			const cleaned = attrs.replace(/\s+data-route="[^"]*"/i, '');
			return `<html${cleaned} data-route="${routeJson}">`;
		});
	} else {
		fail(`模板缺少 <html> 标签，路由数据未注入：${routePath}`);
	}
	return html;
}

// 写盘：目录不存在则 recursive 创建
function writePage(filePath, content) {
	mkdirSync(dirname(filePath), { recursive: true });
	writeFileSync(filePath, content, 'utf-8');
}

// 主流程
function main() {
	console.log(`[buildPages] 变体：${isGh ? 'GitHub Pages (GH_PAGES=1)' : 'Cloudflare Workers (默认)'}`);
	console.log(`[buildPages] 输出目录：${outDir}，canonical 站点：${siteUrl}，base：${base}`);

	// 注意：GH 变体的旧目录清理由 package.json 的 clean:gh 在 vite build 之前完成，
	// 这里不再 rmSync，避免误删 vite 刚把 public/ 数据拷进 dist-gh 的 postlist.json/tags.json。
	// 读取数据文件（vite 已把 public/postlist.json、public/tags.json 拷进产物目录）
	const postlistPath = join(outDir, 'postlist.json');
	const tagsPath = join(outDir, 'tags.json');
	const postlist = readJson(postlistPath);
	const tagsData = readJson(tagsPath);
	if (process.exitCode === 1) return; // 数据文件读取失败：fail() 已报错
	if (!postlist || !Array.isArray(postlist.posts)) {
		fail(`${postlistPath} 缺少 posts 数组字段`);
		return;
	}
	if (!tagsData || !tagsData.tags || typeof tagsData.tags !== 'object') {
		fail(`${tagsPath} 缺少 tags 对象字段`);
		return;
	}
	const posts = postlist.posts;
	const tags = tagsData.tags;

	// 根模板：vite 处理过资源引用的最终形态（脚本与样式已是带 hash 的绝对路径）
	const templatePath = join(outDir, 'index.html');
	let template;
	try {
		template = readFileSync(templatePath, 'utf-8');
	} catch (err) {
		fail(`读取模板 ${templatePath} 失败：${err.message}`);
		return;
	}
	// 模板已有通用 meta description（<meta name="description">）时不重复注入
	const hasExistingDescription = /<meta\s+name=["']description["']/i.test(template);
	// 幂等剥离上次注入的内容（根页面原地更新，重跑不叠加）
	template = stripInjected(template);

	const written = [];

	// 1) 根页面：原地改写（title 保持 "wbw121124's blog" 不变，仅注入 og/canonical + 路由数据）
	writePage(templatePath, buildPage(template, {
		routePath: '/',
		component: 'HomePage',
		props: {},
		title: "wbw121124's blog",
		ogType: 'website',
		description: "wbw121124's blog",
		keepTitle: true,
		hasExistingDescription,
	}));
	written.push(templatePath);

	// 2) 固定静态页（component 与 src/App.vue 的路由表一致）
	const staticPages = [
		{ routePath: '/about/', component: 'AboutPage', title: '关于 - wbw121124\'s blog', description: '关于 wbw121124' },
		{ routePath: '/contact/', component: 'ContactPage', title: '联系 - wbw121124\'s blog', description: '联系 wbw121124' },
		{ routePath: '/archive/', component: 'ArchivePage', title: '文章归档 - wbw121124\'s blog', description: '全部文章的时间线归档' },
		{ routePath: '/tags/', component: 'TagsPage', title: '所有标签 - wbw121124\'s blog', description: '全部标签一览' },
		{ routePath: '/search/', component: 'SearchPage', title: '搜索 - wbw121124\'s blog', description: '站内搜索' },
		{ routePath: '/searchd/', component: 'SearchDPage', title: '搜索详情 - wbw121124\'s blog', description: '站内搜索' },
	];
	for (const page of staticPages) {
		const html = buildPage(template, {
			routePath: page.routePath,
			component: page.component,
			props: {},
			title: page.title,
			ogType: 'website',
			description: page.description,
			hasExistingDescription,
		});
		const filePath = join(outDir, page.routePath, 'index.html');
		writePage(filePath, html);
		written.push(filePath);
	}

	// 3) 文章页：canonical/og:url 用 encodeURIComponent 编码路径；
	// 	磁盘目录用原始 id——静态服务器（Workers Assets / GitHub Pages / preview）收到
	// 	%E4%BA%8C... 这类请求会先 URL 解码再查文件，编码目录名会导致 404 回落根页；
	// 	public/ 下 vite 原样拷贝的中文名目录（posts-html/<id>.json 等）同理
	let postCount = 0;
	for (const post of posts) {
		if (!post || typeof post.id !== 'string' || post.id.length === 0) {
			fail('postlist.json 中存在缺少 id 的文章，已跳过该文章页');
			continue;
		}
		const routePath = `/post/${encodeURIComponent(post.id)}/`;
		const html = buildPage(template, {
			routePath,
			rawPath: `/post/${post.id}/`, // data-route 的 path 用原始 id
			component: 'PostPage',
			props: { name: post.id }, // 原始 id，未编码
			title: post.title ?? post.id,
			ogType: 'article',
			description: post.summary || post.title || post.id,
		});
		const filePath = join(outDir, 'post', post.id, 'index.html');
		writePage(filePath, html);
		written.push(filePath);
		postCount++;
	}

	// 4) 标签页：canonical 用编码路径，磁盘目录用原始标签名（理由同文章页）
	let tagCount = 0;
	for (const tagName of Object.keys(tags)) {
		const routePath = `/tag/${encodeURIComponent(tagName)}/`;
		const html = buildPage(template, {
			routePath,
			rawPath: `/tag/${tagName}/`, // data-route 的 path 用原始标签名
			component: 'TagPage',
			props: { name: tagName }, // 原始标签名，未编码
			title: `标签：${tagName}`,
			ogType: 'website',
			description: `标签「${tagName}」下的全部文章`,
		});
		const filePath = join(outDir, 'tag', tagName, 'index.html');
		writePage(filePath, html);
		written.push(filePath);
		tagCount++;
	}

	// 5) 年份页：每篇 post 的 date 前 4 位去重（props.year 为字符串，与运行时路由参数一致）
	const years = [...new Set(
		posts.map((p) => String(p?.date ?? '').slice(0, 4)).filter((y) => /^\d{4}$/.test(y))
	)];
	for (const year of years) {
		const routePath = `/posts/${year}/`;
		const html = buildPage(template, {
			routePath,
			component: 'YearPage',
			props: { year },
			title: `${year} 年的文章`,
			ogType: 'website',
			description: `${year} 年发布的全部文章`,
		});
		const filePath = join(outDir, routePath, 'index.html');
		writePage(filePath, html);
		written.push(filePath);
	}

	console.log(`[buildPages] 完成：共生成/更新 ${written.length} 个页面（1 根页 + ${staticPages.length} 静态页 + ${postCount} 文章页 + ${tagCount} 标签页 + ${years.length} 年份页）`);
}

main();
