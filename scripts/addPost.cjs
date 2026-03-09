#!/usr/bin/env node
// simple utility to create a new blog post and update postlist.json (CommonJS version)

const fs = require('fs');
const path = require('path');

function usage() {
	console.log(`
Usage: npm run post -- --id <post-id> --title <title> [options]

Options:
  --id        Unique identifier/filename for the post (required)
  --title     Title of the post (required)
  --date      Publish date (YYYY-MM-DD), defaults to today
  --tags      Comma-separated list of tags
  --summary   Short summary

Example:
  npm run post -- --id new-topic --title "New Topic" --tags programming,vue --summary "Brief description"
`);
	process.exit(1);
}

function parseArgs() {
	const args = process.argv.slice(2);
	const out = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg.startsWith('--')) {
			const key = arg.slice(2);
			const value = args[i + 1];
			if (!value || value.startsWith('--')) {
				out[key] = true;
			} else {
				out[key] = value;
				i++;
			}
		}
	}
	return out;
}

const opts = parseArgs();
if (!opts.id || !opts.title) {
	usage();
}

const id = opts.id;
const title = opts.title;
const date = opts.date || new Date().toISOString().slice(0, 10);
const tags = opts.tags ? opts.tags.split(/\s*,\s*/) : [];
const summary = opts.summary || '';

// paths
const postDir = path.resolve(__dirname, '../public/posts');
const listFile = path.resolve(__dirname, '../public/postlist.json');
const postFile = path.join(postDir, `${id}.md`);

// ensure posts directory exists
if (!fs.existsSync(postDir)) {
	fs.mkdirSync(postDir, { recursive: true });
}

if (fs.existsSync(postFile)) {
	console.error(`Post file already exists: ${postFile}`);
	process.exit(1);
}

// create markdown file with frontmatter comment
const frontmatterLines = [
	'<!--',
	`title: ${title}`,
	`date: ${date}`,
	`tags: [${tags.map(t => t.trim()).join(', ')}]`,
	`summary: ${summary}`,
	'-->',
	'',
	`# ${title}`,
	'',
	'（在此撰写正文）',
];
fs.writeFileSync(postFile, frontmatterLines.join('\n'), { encoding: 'utf-8' });
console.log(`Created post file: ${postFile}`);

// update postlist.json
let listData = { posts: [] };
if (fs.existsSync(listFile)) {
	try {
		const raw = fs.readFileSync(listFile, 'utf-8');
		listData = JSON.parse(raw);
	} catch (err) {
		console.error('Failed to read or parse postlist.json:', err);
		process.exit(1);
	}
}

// check for duplicate id
if (listData.posts.find(p => p.id === id)) {
	console.error(`Entry with id "${id}" already exists in postlist.json`);
	process.exit(1);
}

// prepend new entry
const entry = { id, title, date, tags, summary };
listData.posts.unshift(entry);
fs.writeFileSync(listFile, JSON.stringify(listData, null, 2) + '\n', { encoding: 'utf-8' });
console.log(`Updated postlist.json with entry for "${id}"`);
