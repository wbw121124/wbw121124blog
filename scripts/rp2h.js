// rp2h.js：把 public/posts/*.md 渲染为 public/posts-html/*.json 及 postlist/tags/statistics 等数据文件
// 渲染失败的文章会在全部写盘完成后以退出码 1 退出（CI 变红），而不是仅告警后继续、产物静默缺文章
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initMarkdownIt, disposeMarkdownIt } from '../lib/mkd-it.js';
import pangu from 'pangu/browser';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
	url: "http://localhost",
	pretendToBeVisual: true,  // 模拟浏览器视觉环境
	runScripts: "dangerously", // 允许运行脚本
	resources: "usable"
});
const { window } = dom;
const {
	document,
	Node,
	DocumentFragment,
	XPathResult,
	NodeFilter,
	Element,
	HTMLElement,
	Text,           // 添加 Text
	Comment,        // 添加 Comment
	CDATASection,   // 添加 CDATASection
	ProcessingInstruction, // 添加 ProcessingInstruction
	DocumentType,   // 添加 DocumentType
	MutationObserver,
	CustomEvent,
	Event,
	getComputedStyle
} = window;
global.document = document;
global.window = window;
global.Node = Node;
global.DocumentFragment = DocumentFragment;
global.XPathResult = XPathResult;
global.NodeFilter = NodeFilter;
global.Element = Element;
global.HTMLElement = HTMLElement;
global.Text = Text;
global.Comment = Comment;
global.CDATA_SECTION_NODE = window.CDATA_SECTION_NODE;
global.COMMENT_NODE = window.COMMENT_NODE;
global.DOCUMENT_FRAGMENT_NODE = window.DOCUMENT_FRAGMENT_NODE;
global.DOCUMENT_NODE = window.DOCUMENT_NODE;
global.DOCUMENT_TYPE_NODE = window.DOCUMENT_TYPE_NODE;
global.ELEMENT_NODE = window.ELEMENT_NODE;
global.TEXT_NODE = window.TEXT_NODE;
global.ProcessingInstruction = ProcessingInstruction;
global.DocumentType = DocumentType;
global.MutationObserver = MutationObserver;
global.CustomEvent = CustomEvent;
global.Event = Event;
global.getComputedStyle = getComputedStyle;
global.requestIdleCallback = global.requestIdleCallback || function (callback, options) {
	const start = Date.now();
	return setTimeout(function () {
		callback({
			didTimeout: false,
			timeRemaining: function () {
				return Math.max(0, 50 - (Date.now() - start));
			}
		});
	}, 1);
};

global.cancelIdleCallback = global.cancelIdleCallback || function (id) {
	clearTimeout(id);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseFrontmatter(content) {
	if (!content.startsWith('<!--')) {
		return { metadata: {}, content };
	}
	const end = content.indexOf('-->');
	if (end === -1) {
		return { metadata: {}, content };
	}
	const front = content.slice(4, end).trim();
	const body = content.slice(end + 3).trim();
	const metadata = {};
	front.split('\n').forEach(line => {
		const [key, ...vals] = line.split(':');
		if (key && vals.length) metadata[key.trim()] = vals.join(':').trim();
	});
	if (metadata.tags) {
		try {
			metadata.tags = JSON.parse(metadata.tags.replace(/'/g, '"'));
		} catch {
			metadata.tags = metadata.tags.replace(/[\[\]]/g, '').split(/\s*,\s*/).filter(Boolean);
		}
	}
	console.log(metadata);
	return { metadata, content: body };
}

function generateSummary(content, maxLength = 200) {
	// 移除开头的标题行（如果存在）
	content = content.trim().replace(/#[^\n]*\n/g, '');

	// console.log('Content for summary:', content.slice(0, 200) + (content.length > 200 ? '...' : ''));

	// 移除 Markdown 标记，提取纯文本
	const plainText = content.trim()
		.replace(/\n{2,}/g, '\n') // 合并连续的空行
		.replace(/[#*`~>_\[\]()\- \t\f\r\v]/g, ' ') // 移除部分 Markdown 标记
		.replace(/ {2,}/g, ' ')
		.replace(/\n{2,}/g, '\n')
		.replace(/ \n/g, '\n')
		.replace(/\n /g, '\n')
		.trim();

	// 找到第一个 \n 的位置
	const firstIndex = plainText.indexOf('\n');
	// 从第一个 \n 后面开始找第二个 \n
	const secondIndex = plainText.indexOf('\n', firstIndex + 1);
	// 第三个 \n 的位置
	const thirdIndex = plainText.indexOf('\n', secondIndex + 1);
	if (firstIndex != -1 && secondIndex != -1 && thirdIndex != -1)
		maxLength = Math.min(maxLength, thirdIndex - 1)

	if (plainText.length <= maxLength) {
		return plainText;
	}
	return plainText.replace('\n', ' ').replace(/ {2,}/g, ' ').slice(0, maxLength) + '...';
}

function spacingTextNodes(node) {
	if (node.nodeType === Node.TEXT_NODE) {
		if (node.textContent && node.textContent.trim()) {
			node.textContent = pangu.spacingText(node.textContent);
		}
	} else if (node.nodeType === Node.ELEMENT_NODE &&
		!['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT'].includes(node.tagName)) {
		Array.from(node.childNodes).forEach(spacingTextNodes);
	}
}

async function rp2h(list = []) {
	const postsDir = path.join(__dirname, '../public/posts');
	const outDir = path.join(__dirname, '../public/posts-html');
	const postlistPath = path.join(__dirname, '../public/postlist.json');
	const postlistPath2 = path.join(__dirname, '../src/assets/postlist.json');
	const statisticsPath = path.join(__dirname, '../public/statistics.json');
	const statisticsPath1 = path.join(__dirname, '../src/assets/statistics.json');
	const tagsPath = path.join(__dirname, '../public/tags.json');

	// 创建输出目录
	await fs.mkdir(outDir, { recursive: true });

	// 扫描 posts 文件夹，获取所有 .md 文件
	let files;
	try {
		files = await fs.readdir(postsDir);
	} catch (err) {
		console.error('Failed to read posts directory:', err);
		process.exit(1);
	}

	const mdFiles = files.filter(file => file.endsWith('.md'));

	if (mdFiles.length === 0) {
		console.warn('No markdown files found in posts directory.');
		process.exit(0);
	}

	const md = await initMarkdownIt();
	const posts = [];
	// 全文搜索索引条目：与 posts 数组同源同序（仅收录未 hide 的文章，随后统一按日期降序），
	// 最终聚合写入 public/posts-search.json，供 SearchDPage 单请求全文搜索
	const postsSearch = [];
	// 渲染失败的文章先收集到这里，待循环与全部写盘完成后统一报告并置非零退出码
	const failedPosts = [];
	const statistics = {
		total: 0,
		count: 0,
		mem: 0
	};

	for (const file of mdFiles) {
		const id = path.basename(file, '.md');
		const mdPath = path.join(postsDir, file);

		try {
			const raw = await fs.readFile(mdPath, 'utf-8');
			let { metadata, content } = parseFrontmatter(raw);
			let html = md.render(content);
			document.body.innerHTML = html;
			await new Promise(resolve => setTimeout(resolve, 0));
			spacingTextNodes(document.body);
			html = document.body.innerHTML;
			// 后处理：给未带 loading 属性的 <img> 追加 loading="lazy" decoding="async"（Lighthouse CLS/LCP：文章内容图延迟加载）
			// 负向前瞻 (?![^>]*\sloading=) 保证已带 loading 属性的标签不重复添加，重跑幂等；
			// 只作用于 markdown 渲染出的文章内容图，站点自身资源不经此路径
			html = html.replace(/<img(?![^>]*\sloading=)/gi, '<img loading="lazy" decoding="async"');
			// 从渲染结果中提取纯文本（空白折叠），供全文搜索使用；必须在 body 被下一篇文章覆盖前读取
			const text = document.body.textContent.replace(/\s+/g, ' ').trim();
			metadata.title = pangu.spacingText(metadata.title);

			// 生成 post 对象
			const post = {
				id,
				title: metadata.title || id,
				date: metadata.date || new Date().toISOString().split('T')[0],
				tags: metadata.tags || [],
				summary: pangu.spacingText(metadata.summary || generateSummary(content))
			};

			statistics.mem += raw.length;

			if (!metadata.hasOwnProperty("hide")) {
				statistics.total += content.length;
				statistics.count += content.replace(/\s/g, '').length;
				posts.push(post);
				// 同步收集全文搜索条目：title/date/tags/summary 与 postlist 同源（都派生自 metadata），
				// text 用上面已算好的纯文本字段；hide 文章不收录，避免全文泄露
				postsSearch.push({
					id: post.id,
					title: post.title,
					date: post.date,
					tags: post.tags,
					summary: post.summary,
					text
				});
			}
			// 生成文章 JSON 文件
			const out = {
				id,
				metadata: post,
				markdown: content,
				html,
				text
			};

			await fs.writeFile(
				path.join(outDir, `${id}.json`),
				JSON.stringify(out, null, 2) + '\n',
				'utf-8'
			);
			console.log(`Generated posts-html/${id}.json`);
		} catch (err) {
			// 修正错误信息拼接：原写法 err.message + err.stack || err 中左侧恒为真值（undefined 时拼出 "undefinedundefined"），|| err 永不生效
			const errMsg = err && (err.stack || err.message || String(err));
			console.warn(`Warning: failed rendering post ${id}:`, errMsg);
			failedPosts.push({ id, error: errMsg });
		}
	}

	// 按日期降序排序（最新的在前面）
	// postsSearch 用同一 comparator 排序：两数组元素插入顺序相同，JS sort 稳定，
	// 因此 posts-search.json 与 postlist.json 的文章顺序严格一致
	posts.sort((a, b) => new Date(b.date) - new Date(a.date));
	postsSearch.sort((a, b) => new Date(b.date) - new Date(a.date));

	// 生成 postlist.json
	const postlist = { posts };
	const map = {};
	posts.forEach(p => {
		if (p.tags && Array.isArray(p.tags)) {
			p.tags.forEach(t => {
				if (map.hasOwnProperty(t))
					map[t] = map[t] + 1;
				else
					map[t] = 1;
			});
		}
	});
	console.log(map);
	const tags = { tags: map };
	await fs.writeFile(postlistPath, JSON.stringify(postlist, null, 2) + '\n', 'utf-8');
	// await fs.writeFile(postlistPath2, JSON.stringify(postlist, null, 2) + '\n', 'utf-8');
	console.log(`Generated postlist.json with ${posts.length} posts`);
	// 生成 posts-search.json：单请求全文搜索索引（SearchDPage 一次 fetch 拿到全部文章纯文本，替代逐篇 fetch posts-html/<id>.json）
	// 排序与 postlist.json 一致（上方已按日期降序）；await 写盘失败会向上抛出，
	// 由 renderPostsToHtml.js 捕获并置退出码 1，与其他输出的失败处理一致，不让构建静默通过
	await fs.writeFile(
		path.join(__dirname, '../public/posts-search.json'),
		JSON.stringify({ posts: postsSearch }, null, 2) + '\n',
		'utf-8'
	);
	console.log(`Generated posts-search.json with ${postsSearch.length} posts`);
	await fs.writeFile(statisticsPath, JSON.stringify(statistics, null, 2) + '\n', 'utf-8');
	await fs.writeFile(statisticsPath1, JSON.stringify(statistics, null, 2) + '\n', 'utf-8');
	console.log(`Generated statistics.json with ${posts.length} posts`);
	await fs.writeFile(tagsPath, JSON.stringify(tags, null, 2) + '\n', 'utf-8');
	console.log(`Generated tags.json with ${posts.length} posts`);
	for (const tag of Object.keys(map)) {
		let hasTagPosts = { posts: [] };
		posts.filter(x => x.tags && x.tags.includes(tag))
			.forEach(x => {
				hasTagPosts.posts.push(x.id);
			})
		let tagJsonPath = path.join(__dirname, `../public/tag/${encodeURIComponent(tag)}.json`);
		await fs.writeFile(tagJsonPath, JSON.stringify(hasTagPosts, null, 2) + '\n', 'utf-8');
		console.log(`Generated tag/${encodeURIComponent(tag)}.json with ${hasTagPosts.posts.length} posts`);
	}
	// 渲染失败的文章：全部写盘完成后统一报告，置退出码 1 让 CI 变红
	// 用 process.exitCode 而非 process.exit(1)，保证 disposeMarkdownIt 等收尾逻辑先执行完再以非零码退出
	if (failedPosts.length) {
		console.error(`rp2h: ${failedPosts.length} post(s) failed to render:`);
		failedPosts.forEach(f => console.error(`  - ${f.id}: ${f.error}`));
		process.exitCode = 1;
	}
	console.log('Finished renderPostsToHtml.');
	disposeMarkdownIt();
	console.log('Disposed MarkdownIt instance.');
}

export {
	rp2h
};