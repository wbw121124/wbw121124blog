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

// 解析 frontmatter
function parseFrontmatter(content) {
	if (!content.startsWith("<!--")) return { metadata: {}, content }

	// kmp 算法
	function getNext(pattern) {
		const next = Array(pattern.length).fill(0)
		for (let i = 1, j = 0; i < pattern.length; i++) {
			while (j > 0 && pattern[i] !== pattern[j]) {
				j = next[j - 1]
			}
			if (pattern[i] === pattern[j]) {
				j++
			}
			next[i] = j
		}
		return next
	}

	const pattern = "-->"
	const next = getNext(pattern)
	let j = 0
	let endIndex = -1
	for (let i = 0; i < content.length; i++) {
		while (j > 0 && content[i] !== pattern[j]) {
			j = next[j - 1]
		}
		if (content[i] === pattern[j]) {
			j++
		}
		if (j === pattern.length) {
			endIndex = i + 1
			break
		}
	}

	const frontmatter = content.substring(4, endIndex - 3).trim()
	const body = content.substring(endIndex).trim()
	const metadata = {}

	frontmatter.split('\n').forEach(line => {
		const [key, ...values] = line.split(':')
		if (key && values.length) {
			metadata[key.trim()] = values.join(':').trim()
		}
	})

	return { metadata, content: body }
}

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
		const text = await response.text();
		const { metadata, content: markdown } = parseFrontmatter(text);
		console.log(metadata);
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
	<main class="mkd component mt-6">
		<div v-if="isLoading" class="text-center py-8">
			<div
				class="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-gray-900 dark:border-b-white mx-auto">
			</div>
			<p class="mt-2 text-gray-600 dark:text-gray-400">正在加载文章...</p>
		</div>
		<div v-else v-html="postContent"></div>
	</main>
</template>
