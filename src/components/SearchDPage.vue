<script setup>
import { ref, onMounted, computed } from 'vue';
import { defineProps } from 'vue';
const props = defineProps({
	props: { type: Object, required: true }
});

const query = ref('');
const posts = ref([]);
const results = ref([]);
const page = ref(1);
const pageSize = 5;

function highlight(text) {
	if (!text) return '';
	const k = query.value.trim();
	if (!k) return text;
	const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${esc})`, 'gi');
	return text.replace(regex, '<mark>$1</mark>');
}

function snippetFrom(text) {
	if (!text) return '';
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

const pagedResults = computed(() => {
	const s = (page.value - 1) * pageSize;
	return results.value.slice(s, s + pageSize);
});
const total = computed(() => results.value.length);
const highlightedResults = computed(() =>
	pagedResults.value.map(p => ({
		...p,
		title: highlight(p.title),
		summary: highlight(p.summary),
		snippet: snippetFrom(p.text)
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
	if (!query.value.trim()) {
		results.value = [];
		return;
	}
	const k = query.value.trim().toLowerCase();
	results.value = posts.value.filter(p => {
		const title = p.title.toLowerCase();
		const summary = (p.summary || "").toLowerCase();
		const tags = (p.tags || []).map(t => t.toLowerCase()).join(' ');
		const text = (p.text || "").toLowerCase();
		console.log(p, title.includes(k), summary.includes(k), tags.includes(k), text.includes(k));
		return title.includes(k) || summary.includes(k) || tags.includes(k) || text.includes(k);
	});
	page.value = 1;
}

onMounted(async () => {
	const data = await fetch('./postlist.json').then(r => r.json());
	// fetch each post's markdown
	for (const p of data.posts) {
		let text = '';
		try {
			const resp = await fetch(`./posts/${p.id}.md`);
			if (resp.ok) text = await resp.text();
		} catch { }
		const { metadata, content } = parseFrontmatter(text);
		posts.value.push({ ...p, ...metadata, text: content });
	}
	posts.value.sort((a, b) => b.date.localeCompare(a.date));
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
						@click="doSearch">
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
				<a :href="`?path=/post/${post.id}`" class="text-indigo-600 hover:underline" v-html="post.title"></a>
				<span class="text-gray-500">（{{ post.date }}）</span>
				<p v-if="post.snippet" class="text-gray-600 line-clamp-2" v-html="post.snippet"></p>
				<p v-else class="text-gray-600 line-clamp-2" v-html="post.summary"></p>
			</div>
			<el-pagination class="mt-4" background small :page-size="pageSize" :current-page="page" :total="total"
				@current-change="page = $event" />
		</div>
	</main>
</template>
