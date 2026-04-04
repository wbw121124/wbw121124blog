<script setup>
import { ref, onMounted } from 'vue';
const tags = ref([]);
const data = ref({});

onMounted(async () => {
	data.value = await fetch('./tags.json').then(r => r.json());
	tags.value = Object.keys(data.value.tags).sort();
});
</script>

<template>
	<main class="component">
		<h2 class="text-2xl font-bold mb-6">所有标签</h2>
		<div class="flex flex-wrap gap-2">
			<span v-for="tag in tags" :key="tag" class="tag"><a :href="`?path=/tag/${encodeURIComponent(tag)}`">{{ tag }}</a> {{ data.tags[tag] }}</span>
		</div>
	</main>
</template>
