<script setup>
import { ref, onMounted, computed } from 'vue';
import { defineProps } from 'vue';
import Fuse from 'fuse.js';
const props = defineProps({
	props: { type: Object, required: true }
});

const query = ref('');
const posts = ref([]);
const results = ref([]);
const page = ref(1);
const pageSize = 5;
let fuse = null;

function highlight(text) {
	if (!text) return '';
	const k = query.value.trim().replace(/ /g, '');
	if (!k) return text;
	const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${esc})`, 'gi');
	return text.replace(/ /g, '').replace(regex, '<mark>$1</mark>');
}

function highlightByMatches(text, matchObj) {
	if (!text) return '';
	if (!matchObj || !matchObj.indices || !matchObj.indices.length) {
		return highlight(text);
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
		out += chars[i];
	}
	if (inMark) out += '</mark>';
	return out;
}

function snippetFrom(text, matchObj) {
	if (!text) return '';
	if (!matchObj || !matchObj.indices || !matchObj.indices.length) {
		const k = query.value.trim().toLowerCase();
		const lower = text.toLowerCase();
		const idx = lower.indexOf(k);
		if (idx === -1) return '';
		const start = Math.max(0, idx - 30);
		const end = Math.min(text.length, idx + k.length + 30);
		let sn = text.slice(start, end);
		if (start > 0) sn = '...' + sn;
		if (end < text.length) sn = sn + '...';
		return highlight(sn);
	}
	// use first match to build snippet window
	const [s, e] = matchObj.indices[0];
	const start = Math.max(0, s - 30);
	const end = Math.min(text.length, e + 30);
	let sn = text.slice(start, end);
	if (start > 0) sn = '...' + sn;
	if (end < text.length) sn = sn + '...';
	// adjust match indices to snippet-relative
	const adj = { indices: [] };
	for (const [ms, me] of matchObj.indices) {
		const rs = Math.max(ms - start, 0);
		const re = Math.min(me - start, sn.length - 1);
		if (re >= 0 && rs < sn.length) adj.indices.push([rs, re]);
	}
	return highlightByMatches(sn, adj);
}

const pagedResults = computed(() => {
	const s = (page.value - 1) * pageSize;
	return results.value.slice(s, s + pageSize);
});
const total = computed(() => results.value.length);
const highlightedResults = computed(() =>
	pagedResults.value.map(p => ({
		...p,
		title: highlightByMatches(p.title, (p._matches || []).find(m => m.key === 'title')),
		summary: highlightByMatches(p.summary, (p._matches || []).find(m => m.key === 'summary')),
		snippet: snippetFrom(p.text, (p._matches || []).find(m => m.key === 'text'))
	}))
);

function parseFrontmatter(content) {
	if (!content.startsWith("\<!--"))
		return { metadata: {}, content };
	const end = content.indexOf("--\>");
	if (end === -1) return { metadata: {}, content };
	const front = content.substring(4, end).trim();
	const body = content.substring(end + 3).trim();
	const md = {};
	front.split('\n').forEach(line => {
		const [key, ...vals] = line.split(':');
		if (key && vals.length) md[key.trim()] = vals.join(':').trim();
	});
	if (md.tags) {
		try { md.tags = JSON.parse(md.tags.replace(/'/g, '"')); }
		catch { md.tags = md.tags.replace(/\[|\]/g, '').split(/\s*,\s*/).filter(Boolean); }
	}
	return { metadata: md, content: body };
}

function doSearch() {
	const q = query.value.trim();
	if (!q || !fuse) {
		results.value = [];
		page.value = 1;
		return;
	}
	try {
		let res = fuse.search(q);
		res = res.sort((a, b) => (b.score ?? 1) - (a.score ?? 1));
		results.value = res.map(r => ({ ...r.item, _score: r.score, _matches: r.matches || [] }));
	} catch (e) {
		results.value = [];
	}
	page.value = 1;
}

import data from '../assets/postlist.json';

onMounted(async () => {
	// const data = await fetch('./postlist.json').then(r => r.json());
	for (const p of data.posts || []) {
		try {
			const resp = await fetch(`./posts-html/${p.id}.json`);
			if (!resp.ok) {
				posts.value.push({ ...p, text: '' });
				continue;
			}
			const json = await resp.json();
			const metadata = json.metadata || {};
			posts.value.push({ ...p, ...metadata, text: json.text || '' });
		} catch (e) {
			posts.value.push({ ...p, text: '' });
		}
	}
	posts.value.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
	fuse = new Fuse(posts.value, {
		keys: [
			{ name: 'title', weight: 0.6 },
			{ name: 'summary', weight: 0.15 },
			{ name: 'tags', weight: 0.05 },
			{ name: 'text', weight: 0.2 }
		],
		includeScore: true,
		includeMatches: true,
		threshold: 0.4
	});
	if (props.props.keys) {
		query.value = decodeURIComponent(props.props.keys);
		doSearch();
	}
});
</script>

<template>
	<main class="component">
		<h2 class="text-2xl font-bold mb-4">全文搜索："{{ query }}"</h2>
		<div class="mb-6">
			<el-input v-model="query" placeholder="请输入关键词" class="w-full max-w-md" size="default"
				@keyup.enter.native="doSearch" @blur="doSearch">
				<template #append>
					<el-button size="default" style="border-top-left-radius: 0; border-bottom-left-radius: 0;"
						@click="doSearch" aria-label="搜索">
						<el-icon>
							<Search />
						</el-icon>
					</el-button>
				</template>
			</el-input>
		</div>
		<div v-if="results.length === 0">
			<p class="text-gray-600">没有找到匹配的文章。</p>
		</div>
		<div v-else>
			<div v-for="post in highlightedResults" :key="post.id" class="mt-4">
				<a :href="`?path=/post/${post.id}`" class="text-indigo-600 dark:text-indigo-500 hover:underline"
					v-html="post.title"></a>
				<span class="text-gray-500">（{{ post.date }}）</span>
				<p v-if="post.snippet" class="text-gray-600 line-clamp-2" v-html="post.snippet"></p>
				<p v-else class="text-gray-600 line-clamp-2" v-html="post.summary"></p>
			</div>
			<el-pagination class="mt-4" background size="small" :page-size="pageSize" :current-page="page"
				:total="total" hide-on-single-page="true" @current-change="page = $event" />
		</div>
	</main>
</template>
