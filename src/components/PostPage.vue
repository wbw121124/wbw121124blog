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
// start with empty metadata; 'ready' flag will be added after parsing
const metadata = ref({});

// 解析 frontmatter
function parseFrontmatter(content, postName) {
	if (!content.startsWith("<!--")) return { metadata: { title: postName }, content }

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

	// convert tags string to array if present
	if (metadata.tags) {
		try {
			// assume JSON-like list
			metadata.tags = JSON.parse(metadata.tags.replace(/'/g, '"'))
		} catch (e) {
			// fallback comma split
			metadata.tags = metadata.tags.replace(/\[|\]/g, '').split(/\s*,\s*/).filter(Boolean)
		}
	}

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
		const { metadata: _metadata, content: markdown } = parseFrontmatter(text, postName);
		const module = await loadMarkdownIt();
		const mdit = await module.initMarkdownIt();
		postContent.value = mdit.render(markdown);
		// mark metadata as ready so template can display it
		_metadata.ready = true;
		metadata.value = _metadata;
		isLoading.value = false;
	} catch (error) {
		const message = error instanceof Error ? error.message + '\n' + error.stack : String(error);
		// 转义 HTML 标签
		const escapedMessage = message.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

		postContent.value = '加载文章时出错：<pre><code>' + escapedMessage + '</code></pre>';
		isLoading.value = false;
	}
});

</script>

<template>
	<main class="mkd component mt-6">
		<div v-if="metadata !== null && metadata.ready === true" class="metadata">
			<h2>{{ metadata.title }}</h2>
			<div v-if="metadata.tags && metadata.tags.length" class="flex flex-wrap gap-1 mt-1">
				<span v-for="t in metadata.tags" :key="t" class="tag">
					<a :href="`?path=/tag/${encodeURIComponent(t)}`">{{ t }}</a>
				</span>
			</div>
			<p>作者: {{ metadata.author || 'wbw121124' }}</p>
			<p>发布时间: {{ metadata.date || 'Unknow' }}</p>
			<p>协议: <a
					:href="'https://creativecommons.org/licenses/' + (metadata.license || 'BY-NC-SA') + '/4.0/deed.zh-hans'">CC&ThinSpace;
					{{ metadata.license || 'BY-NC-SA' }}&ThinSpace;4.0</a></p>
		</div>
		<div v-if="isLoading" class="text-center py-8">
			<div
				class="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-gray-900 dark:border-b-white mx-auto">
			</div>
			<p class="mt-2 text-gray-600 dark:text-gray-400">正在加载文章...</p>
		</div>
		<div v-else v-html="postContent || '内容加载失败。'"></div>
	</main>
</template>
