<script setup>
import { ref, onMounted } from 'vue';
const tags = ref([]);

onMounted(async () => {
	const data = await fetch('./postlist.json').then(r => r.json());
	const set = new Set();
	data.posts.forEach(p => {
		if (p.tags && Array.isArray(p.tags)) {
			p.tags.forEach(t => set.add(t));
		}
	});
	tags.value = Array.from(set).sort();
});
</script>

<template>
	<main class="component">
		<h2 class="text-2xl font-bold mb-6">所有标签</h2>
		<div class="flex flex-wrap gap-2">
			<a v-for="tag in tags" :key="tag" :href="`?path=/tag/${encodeURIComponent(tag)}`" class="tag">{{ tag }}</a>
		</div>
	</main>
</template>
