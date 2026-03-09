<script setup>
import { ref, onMounted } from 'vue';
import { defineProps } from 'vue';
const props = defineProps({
	props: { type: Object, required: true }
});

const posts = ref([]);
const tagName = ref('');

onMounted(async () => {
	const data = await fetch('./postlist.json').then(r => r.json());
	posts.value = data.posts.sort((a, b) => b.date.localeCompare(a.date));
	if (props.props.name) {
		tagName.value = decodeURIComponent(props.props.name);
		posts.value = posts.value.filter(p => p.tags && p.tags.includes(tagName.value));
	}
});
</script>

<template>
	<main class="component">
		<h2 class="text-2xl font-bold mb-6">标签：{{ tagName }}</h2>
		<div v-if="posts.length === 0" class="text-gray-600">暂无相关文章。</div>
		<div v-for="post in posts" :key="post.id" class="mt-4">
			<a :href="`?path=/post/${post.id}`" class="text-indigo-600 hover:underline">{{ post.title }}</a>
			<span class="text-gray-500">（{{ post.date }}）</span>
		</div>
	</main>
</template>
