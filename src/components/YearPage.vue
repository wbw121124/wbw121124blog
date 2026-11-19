<script setup>
import { ref, onMounted } from 'vue';
import { defineProps } from 'vue';
import { withBase } from '../lib/withBase.js';
import fetchJson from '../lib/fetchJson.js';
const props = defineProps({
	props: { type: Object, required: true }
});

const posts = ref([]);
const year = ref('');
const grouped = ref({});
const state = ref('loading');
const errorMsg = ref('');

onMounted(async () => {
	state.value = 'loading';
	try {
		const data = await fetchJson(withBase('postlist.json'));
		let arr = data.posts.sort((a, b) => b.date.localeCompare(a.date));
		if (props.props.year) {
			year.value = props.props.year;
			arr = arr.filter(p => p.date && p.date.startsWith(year.value));
		}
		// group by month
		const map = {};
		arr.forEach(p => {
			const month = p.date ? p.date.slice(0, 7) : '';
			if (!map[month]) map[month] = [];
			map[month].push(p);
		});
		// sort keys descending
		const sortedKeys = Object.keys(map).sort((a, b) => b.localeCompare(a));
		const obj = {};
		sortedKeys.forEach(k => obj[k] = map[k]);
		grouped.value = obj;
		state.value = Object.keys(grouped.value).length === 0 ? 'empty' : 'success';
	} catch (err) {
		state.value = 'error';
		errorMsg.value = err.message || String(err);
	}
});
</script>

<template>
	<main class="component">
		<!-- loading -->
		<div v-if="state === 'loading'" class="text-gray-600 flex items-center justify-center min-h-[300px]">
			<!-- 等宽四边框保证旋转层对称，修复圆心漂移；motion-reduce 下停止动画 -->
			<!-- 颜色走内联样式：--color-primary 在 :root 而非 @theme，border-primary/25 不会生成 CSS -->
			<div class="animate-spin rounded-full h-8 w-8 border-2 motion-reduce:animate-none" style="border-color: color-mix(in srgb, var(--color-primary) 25%, transparent); border-bottom-color: var(--color-primary);" role="status" aria-label="加载中"></div>
		</div>
		<!-- empty（数据加载成功但无内容） -->
		<div v-else-if="state === 'empty'" class="text-gray-600 flex items-center justify-center min-h-[300px]">
			该年份暂无文章。
		</div>
		<!-- error -->
		<div v-else-if="state === 'error'" class="text-red-600 flex items-center justify-center min-h-[300px]">
			加载失败：{{ errorMsg }}
		</div>
		<!-- success -->
		<div v-else>
			<h2 class="text-2xl font-bold mb-6">{{ year }} 年的文章</h2>
			<div v-for="(posts, month) in grouped" :key="month" class="mb-6">
				<h3 class="text-xl font-semibold">{{ month }}</h3>
				<div v-for="post in posts" :key="post.id" class="mt-2">
					<a :href="withBase(`/post/${encodeURIComponent(post.id)}/`)" class="href hover:underline">{{ post.title }}</a>
					<span class="text-gray-500">（{{ post.date }}）</span>
				</div>
			</div>
		</div>
	</main>
</template>
