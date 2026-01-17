<script setup>
import { ref, onMounted } from 'vue';

const posts = ref([]);
const archives = ref({});

onMounted(async () => {
	try {
		const data = await fetch('/postlist.json').then(res => res.json());
		posts.value = data.posts;

		// 按年月分组
		const grouped = {};
		posts.value.forEach(post => {
			const date = new Date(post.date);
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const key = `${year}-${month.toString().padStart(2, '0')}`;
			if (!grouped[key]) {
				grouped[key] = [];
			}
			grouped[key].push(post);
		});
		archives.value = grouped;
	} catch (error) {
		console.error('加载文章列表失败:', error);
	}
});
</script>

<template>
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md mt-6">
		<h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">文章归档</h2>
		<div v-if="Object.keys(archives).length === 0" class="text-center py-8">
			<p class="text-gray-600 dark:text-gray-400">暂无文章</p>
		</div>
		<div v-else>
			<div v-for="(postsInMonth, monthKey) in archives" :key="monthKey" class="mb-8">
				<h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
					{{ monthKey.replace('-', '年') }}月
				</h3>
				<ul class="space-y-4">
					<li v-for="post in postsInMonth" :key="post.id" class="border-l-4 border-indigo-500 pl-4">
						<a :href="`/?path=/post/${post.id}`"
							class="block hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded transition-colors">
							<h4 class="text-lg font-medium text-indigo-600 hover:underline">{{ post.title }}</h4>
							<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ post.summary }}</p>
							<div class="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
								<span>{{ post.date }}</span>
								<span v-if="post.tags && post.tags.length" class="ml-4">
									标签: {{ post.tags.join(', ') }}
								</span>
							</div>
						</a>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>