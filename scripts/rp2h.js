import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initMarkdownIt } from '../lib/mkd-it.js';
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

function generateSummary(content, maxLength = 150) {
	// 移除开头的标题行（如果存在）
	content = content.trim().replace(/#[^\n]*\n/g, '');

	// console.log('Content for summary:', content.slice(0, 200) + (content.length > 200 ? '...' : ''));

	// 移除 Markdown 标记，提取纯文本
	const plainText = content.trim()
		.replace(/\n{2,}/g, '\n') // 合并连续的空行
		.replace(/[#*`~>_\[\]()\- \t\f\r\v]/g, '') // 移除部分 Markdown 标记
		.replace(/\n{2,}/g, '\n')
		.trim();

	// 找到第一个 \n 的位置
	const firstIndex = plainText.indexOf('\n');
	// 从第一个 \n 后面开始找第二个 \n
	const secondIndex = plainText.indexOf('\n', firstIndex + 1);
	if (firstIndex != -1 && secondIndex != -1)
		maxLength = Math.min(maxLength, secondIndex - 1)

	if (plainText.length <= maxLength) {
		return plainText;
	}
	return plainText.replace('\n', ' ').slice(0, maxLength) + '...';
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

async function rp2h() {
	const postsDir = path.join(__dirname, '../public/posts');
	const outDir = path.join(__dirname, '../public/posts-html');
	const postlistPath = path.join(__dirname, '../public/postlist.json');
	const statisticsPath = path.join(__dirname, '../public/statistics.json');
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
			}
			// 生成文章 JSON 文件
			const out = {
				id,
				metadata: post,
				markdown: content,
				html,
				text: content
			};

			await fs.writeFile(
				path.join(outDir, `${id}.json`),
				JSON.stringify(out, null, 2) + '\n',
				'utf-8'
			);
			console.log(`Generated posts-html/${id}.json`);
		} catch (err) {
			console.warn(`Warning: failed rendering post ${id}:`, err.message + err.stack || err);
		}
	}

	// 按日期降序排序（最新的在前面）
	posts.sort((a, b) => new Date(b.date) - new Date(a.date));

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
	console.log(`Generated postlist.json with ${posts.length} posts`);
	await fs.writeFile(statisticsPath, JSON.stringify(statistics, null, 2) + '\n', 'utf-8');
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
	console.log('Finished renderPostsToHtml.');
}

export {
	rp2h
};