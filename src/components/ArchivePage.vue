<script setup>
import { ref, onMounted } from 'vue';

const posts = ref([]);
const archives = ref({});

onMounted(async () => {
	try {
		const data = await fetch('./postlist.json').then(res => res.json());
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
	<main class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md mt-6">
		<h2 class="text-2xl font-bold mb-6">文章归档</h2>
		<div v-if="Object.keys(archives).length === 0" class="text-center py-8">
			<p class="text-gray-600 dark:text-gray-400">暂无文章</p>
		</div>
		<div v-else>
			<div v-for="(postsInMonth, monthKey) in archives" :key="monthKey" class="mb-8">
				<h3 class="text-xl font-semibold mb-4 border-b pb-2">
					{{ monthKey.replace('-', '年') }}月
				</h3>
				<div class="space-y-4 w-full">
					<div v-for="post in postsInMonth" :key="post.id" class="border-l-3 border-gray-300 pl-2 m-0">
						<a :href="`?path=/post/${post.id}`"
							class="block hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded transition-colors">
							<h3
								class="text-xl font-bold text-indigo-600 dark:text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-300 mb-2">
								{{ post.title }}
							</h3>
							<p class="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{{ post.summary }}</p>
							<div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
								<span>{{ post.date }}</span>
								<div class="flex flex-wrap gap-1">
									<span v-for="tag in post.tags" :key="tag"
										class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-xs">
										{{ tag }}
									</span>
								</div>
							</div>
						</a>
					</div>
				</div>
			</div>
		</div>
	</main>
</template>