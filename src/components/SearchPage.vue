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

const pagedResults = computed(() => {
	const start = (page.value - 1) * pageSize;
	return results.value.slice(start, start + pageSize);
});

const highlightedResults = computed(() =>
	pagedResults.value.map(p => ({
		...p,
		title: highlight(p.title),
		summary: highlight(p.summary)
	}))
);

const total = computed(() => results.value.length);

function runSearch(keys) {
	const k = keys.trim().toLowerCase();
	if (!k) {
		results.value = [];
		return;
	}
	results.value = posts.value.filter(p => {
		const inTitle = p.title && p.title.toLowerCase().includes(k);
		const inSummary = p.summary && p.summary.toLowerCase().includes(k);
		const inTags = p.tags && p.tags.some(t => t.toLowerCase().includes(k));
		return inTitle || inSummary || inTags;
	});
}

onMounted(async () => {
	const data = await fetch('./postlist.json').then(res => res.json());
	posts.value = data.posts.sort((a, b) => b.date.localeCompare(a.date));
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
						@click="doSearch">
						<el-icon>
							<Search />
						</el-icon>
					</el-button>
				</template>
			</el-input>
			<a v-if="query" :href="`?path=/searchd/${encodeURIComponent(query)}`"
				class="text-sm text-indigo-600 hover:underline">全文搜索</a>
		</div>
		<div v-if="results.length === 0">
			<p class="text-gray-600">没有找到匹配的文章。</p>
		</div>
		<div v-else>
			<div v-for="post in highlightedResults" :key="post.id" class="mt-4">
				<a :href="`?path=/post/${post.id}`" class="text-indigo-600 hover:underline" v-html="post.title"></a>
				<span class="text-gray-500">（{{ post.date }}）</span>
				<p class="text-gray-600 line-clamp-2" v-html="post.summary"></p>
			</div>
			<el-pagination class="mt-4" background small :page-size="pageSize" :current-page="page" :total="total"
				@current-change="page = $event" />
		</div>
	</main>
</template>
