<script setup>
import { computed, ref } from 'vue';

const posts = ref([]);
const perPage = 10; // 默认每页10个
const currentPage = ref(1);

import postlist from '../assets/postlist.json';

posts.value = postlist.posts || [];

// // load data
// fetch('./postlist.json')
// 	.then(res => res.json())
// 	.then(data => {
// 		posts.value = data.posts || [];
// 	});

const pagedPosts = computed(() => {
	const start = (currentPage.value - 1) * perPage;
	return posts.value.slice(start, start + perPage);
});
</script>

<template>
	<div v-for="post in pagedPosts" :key="post.id" class="transition-shadow duration-300 mt-6">
		<a :href="`?path=/post/${post.id}`" class="block component transition-colors">
			<h3 class="LXGWNeoXiHeiPlus text-xl font-bold text-indigo-600 dark:text-indigo-500 mb-2">
				{{ post.title }}
			</h3>
			<p class="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{{ post.summary }}</p>
			<div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
				<span>{{ post.date }}</span>
				<div class="flex flex-wrap gap-1">
					<span v-for="tag in post.tags" :key="tag" class="tag">
						{{ tag }}
					</span>
				</div>
			</div>
		</a>
	</div>


	<!-- 分页控件 -->
	<div class="mt-8 flex justify-center">
		<el-pagination background size="small" :page-size="perPage" :current-page="currentPage" :total="posts.length"
			hide-on-single-page="true" @current-change="currentPage = $event" />
	</div>
</template>
