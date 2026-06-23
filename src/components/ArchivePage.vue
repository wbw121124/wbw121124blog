<script setup>
import { ref, onMounted } from 'vue';
const posts = ref([]);
const grouped = ref({});

// import data from '../assets/postlist.json';

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
		<div v-for="(months, year) in grouped" :key="year">
			<h3 class="text-xl font-semibold">{{ -year }}</h3>
			<el-timeline mode="start" class="pt-2">
				<el-timeline-item v-for="(posts, ym) in months" :key="ym" placement="top" :timestamp="ym">
					<el-card shadow="hover">
						<div v-for="post in posts" :key="post.id" class="mt-1 ml-4">
							<a :href="`?path=/post/${post.id}`" class="href hover:underline">{{ post.title }}</a>
							<span class="text-gray-500">（{{ post.date }}）</span>
						</div>
					</el-card>
				</el-timeline-item>
			</el-timeline>
		</div>
	</main>
</template>
