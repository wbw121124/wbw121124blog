import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initMarkdownIt } from '../src/mkd-it.js';

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
	// 移除 Markdown 标记，提取纯文本
	const plainText = content
		.replace(/[#*`~>_\[\]()\- \t\f\r\v]/g, '') // 移除部分 Markdown 标记
		.trim();

	// 找到第一个 \n 的位置
	const firstIndex = content.indexOf('\n');
	// 从第一个 \n 后面开始找第二个 \n
	const secondIndex = content.indexOf('\n', firstIndex + 1);
	if (firstIndex != -1 && secondIndex != -1)
		maxLength = Math.min(maxLength, secondIndex - 1)

	if (plainText.length <= maxLength) {
		return plainText;
	}
	return plainText.slice(0, maxLength) + '...';
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
			const { metadata, content } = parseFrontmatter(raw);
			const html = md.render(content);

			// 生成 post 对象
			const post = {
				id,
				title: metadata.title || id,
				date: metadata.date || new Date().toISOString().split('T')[0],
				tags: metadata.tags || [],
				summary: metadata.summary || generateSummary(content)
			};

			statistics.mem += raw.length;

			if (!metadata.hasOwnProperty("hide") ||
				metadata.hide == "false" ||
				metadata.hide == "show") {
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