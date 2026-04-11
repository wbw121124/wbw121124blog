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

const pagedResults = computed(() => {
	const start = (page.value - 1) * pageSize;
	return results.value.slice(start, start + pageSize);
});

const highlightedResults = computed(() =>
	pagedResults.value.map(p => ({
		...p,
		title: highlightByMatches(p.title, (p._matches || []).find(m => m.key === 'title')),
		summary: highlightByMatches(p.summary, (p._matches || []).find(m => m.key === 'summary'))
	}))
);

const total = computed(() => results.value.length);

function runSearch(keys) {
	const k = keys.trim();
	if (!k || !fuse) {
		results.value = [];
		return;
	}
	try {
		let res = fuse.search(k);
		res = res.sort((a, b) => (b.score ?? 1) - (a.score ?? 1));
		results.value = res.map(r => ({ ...r.item, _score: r.score, _matches: r.matches || [] }));
	} catch (e) {
		results.value = [];
	}
}

onMounted(async () => {
	const data = await fetch('./postlist.json').then(res => res.json());
	posts.value = data.posts.sort((a, b) => b.date.localeCompare(a.date));
	fuse = new Fuse(posts.value, {
		keys: [
			{ name: 'title', weight: 0.6 },
			{ name: 'summary', weight: 0.3 },
			{ name: 'tags', weight: 0.1 }
		],
		includeScore: true,
		includeMatches: true,
		threshold: 0.4
	});
	if (props.props.keys) {
		query.value = decodeURIComponent(props.props.keys);
		runSearch(query.value);
	}
});

function doSearch() {
	if (query.value.trim()) {
		const k = encodeURIComponent(query.value.trim());
		window.location.href = `?path=/search/${k}`;
	}
}
</script>

<template>
	<main class="component">
		<h2 class="text-2xl font-bold mb-4">搜索："{{ query }}"</h2>
		<div class="mb-6 flex items-center gap-2">
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
			<a v-if="query" :href="`?path=/searchd/${encodeURIComponent(query)}`"
				class="text-sm href hover:underline">全文搜索</a>
		</div>
		<div v-if="results.length === 0">
			<p class="text-gray-600">没有找到匹配的文章。</p>
		</div>
		<div v-else>
			<div v-for="post in highlightedResults" :key="post.id" class="mt-4">
				<a :href="`?path=/post/${post.id}`" class="text-indigo-600 dark:text-indigo-500 hover:underline"
					v-html="post.title"></a>
				<span class="text-gray-500">（{{ post.date }}）</span>
				<p class="text-gray-600 line-clamp-2" v-html="post.summary"></p>
			</div>
			<el-pagination class="mt-4" background size="small" :page-size="pageSize" :current-page="page"
				:total="total" hide-on-single-page="true" @current-change="page = $event" />
		</div>
	</main>
</template>
