<script setup>
import { ref, onMounted } from 'vue';
import { defineProps } from 'vue';
const props = defineProps({
	props: { type: Object, required: true }
});

const posts = ref([]);
const year = ref('');
const grouped = ref({});

// import data from '../assets/postlist.json';

onMounted(async () => {
	const data = await fetch('./postlist.json').then(r => r.json());
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
});
</script>

<template>
	<main class="component">
		<h2 class="text-2xl font-bold mb-6">{{ year }} 年的文章</h2>
		<div v-if="Object.keys(grouped).length === 0" class="text-gray-600">暂无相关文章。</div>
		<div v-for="(posts, month) in grouped" :key="month" class="mb-6">
			<h3 class="text-xl font-semibold">{{ month }}</h3>
			<div v-for="post in posts" :key="post.id" class="mt-2">
				<a :href="`?path=/post/${post.id}`" class="href hover:underline">{{ post.title }}</a>
				<span class="text-gray-500">（{{ post.date }}）</span>
			</div>
		</div>
	</main>
</template>
