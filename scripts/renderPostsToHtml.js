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
	return { metadata, content: body };
}

async function main() {
	const postlistPath = path.join(__dirname, '../public/postlist.json');
	const postsDir = path.join(__dirname, '../public/posts');
	const outDir = path.join(__dirname, '../public/posts-html');

	await fs.mkdir(outDir, { recursive: true });

	let listData;
	try {
		const raw = await fs.readFile(postlistPath, 'utf-8');
		listData = JSON.parse(raw);
	} catch (err) {
		console.error('Failed to read postlist.json:', err);
		process.exit(1);
	}

	const md = await initMarkdownIt();

	for (const post of listData.posts || []) {
		const id = post.id;
		const mdPath = path.join(postsDir, `${id}.md`);
		try {
			const raw = await fs.readFile(mdPath, 'utf-8');
			const { metadata, content } = parseFrontmatter(raw);
			const html = md.render(content);
			const out = {
				id,
				metadata: {
					...post,
					...(metadata || {})
				},
				markdown: content,
				html,
				text: content
			};
			await fs.writeFile(path.join(outDir, `${id}.json`), JSON.stringify(out, null, 2) + '\n', 'utf-8');
			console.log(`Generated posts-html/${id}.json`);
		} catch (err) {
			console.warn(`Warning: failed rendering post ${id}:`, err.message || err);
		}
	}
	console.log('Finished renderPostsToHtml.');
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
