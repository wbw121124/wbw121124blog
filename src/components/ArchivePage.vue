<script setup>
import { ref, onMounted } from 'vue';
const posts = ref([]);
const grouped = ref({});

onMounted(async () => {
	const data = await fetch('./postlist.json').then(r => r.json());
	const arr = data.posts.sort((a, b) => b.date.localeCompare(a.date));
	// nest by year-month
	const map = {};
	arr.forEach(p => {
		if (!p.date) return;
		const ym = p.date.slice(0, 7); // YYYY-MM
		const y = p.date.slice(0, 4);
		if (!map[y]) map[y] = {};
		if (!map[y][ym]) map[y][ym] = [];
		map[y][ym].push(p);
	});
	// sort years desc and months desc
	const sorted = {};
	Object.keys(map).sort((a, b) => b.localeCompare(a)).forEach(y => {
		sorted[-y] = {};
		Object.keys(map[y]).sort((a, b) => b.localeCompare(a)).forEach(m => {
			sorted[-y][m] = map[y][m];
		});
	});
	grouped.value = sorted;
});
</script>

<template>
	<main class="component">
		<h2 class="text-2xl font-bold mb-6">文章归档</h2>
		<div v-for="(months, year) in grouped" :key="year" class="mb-6">
			<h3 class="text-xl font-semibold">{{ -year }}</h3>
			<div v-for="(posts, ym) in months" :key="ym" class="ml-4 mb-4">
				<h4 class="text-lg font-medium">{{ ym }}</h4>
				<div v-for="post in posts" :key="post.id" class="mt-1 ml-4">
					<a :href="`?path=/post/${post.id}`" class="href hover:underline">{{ post.title }}</a>
					<span class="text-gray-500">（{{ post.date }}）</span>
				</div>
			</div>
		</div>
	</main>
</template>
