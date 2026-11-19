<script setup>
import { ref, onMounted } from 'vue';
import { defineProps } from 'vue';
import { withBase } from '../lib/withBase.js';
import fetchJson from '../lib/fetchJson.js';
const props = defineProps({
	props: { type: Object, required: true }
});

const posts = ref([]);
const tagName = ref('');
const state = ref('loading');
const errorMsg = ref('');

onMounted(async () => {
	state.value = 'loading';
	try {
		const data = await fetchJson(withBase('postlist.json'));
		let arr = data.posts.sort((a, b) => b.date.localeCompare(a.date));
		if (props.props.name) {
			tagName.value = decodeURIComponent(props.props.name);
			arr = arr.filter(p => p.tags && p.tags.includes(tagName.value));
		}
		posts.value = arr;
		state.value = posts.value.length === 0 ? 'empty' : 'success';
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
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
		<!-- empty（数据加载成功但无内容） -->
		<div v-else-if="state === 'empty'" class="text-gray-600 flex items-center justify-center min-h-[300px]">
			该标签下暂无文章。
		</div>
		<!-- error -->
		<div v-else-if="state === 'error'" class="text-red-600 flex items-center justify-center min-h-[300px]">
			加载失败：{{ errorMsg }}
		</div>
		<!-- success -->
		<div v-else>
			<h2 class="text-2xl font-bold mb-6">标签：{{ tagName }}</h2>
			<div v-for="post in posts" :key="post.id" class="mt-4">
				<a :href="withBase(`/post/${encodeURIComponent(post.id)}/`)" class="href hover:underline">{{ post.title }}</a>
				<span class="text-gray-500">（{{ post.date }}）</span>
			</div>
		</div>
	</main>
</template>
