<script setup>
// 获取组件 props
import { defineProps } from 'vue';
// 定义 Props
const props = defineProps({
	props: {
		type: Object,
		required: true  // 必需的 Props
	}
});
import { onMounted, ref } from 'vue';
import { loadMarkdownIt } from '/src/main.js';
const postContent = ref('加载中...');
const isLoading = ref(true);

// 异步加载并使用markdown-it
onMounted(async () => {
	try {
		const postName = props.props.name;
		const response = await fetch(`./posts/${postName}.md`);
		if (!response.ok) {
			postContent.value = '文章未找到。';
			isLoading.value = false;
			return;
		}
		const markdown = await response.text();
		const module = await loadMarkdownIt();
		const mdit = await module.initMarkdownIt();
		postContent.value = mdit.render(markdown);
		isLoading.value = false;
	} catch (error) {
		postContent.value = '加载文章时出错：' + error.message + '\n' + error.stack;
		isLoading.value = false;
	}
});

</script>

<template>
	<main class="mkd bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md mt-6">
		<div v-if="isLoading" class="text-center py-8">
			<div
				class="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-gray-900 dark:border-b-white mx-auto">
			</div>
			<p class="mt-2 text-gray-600 dark:text-gray-400">正在加载文章...</p>
		</div>
		<div v-else v-html="postContent"></div>
	</main>
</template>
