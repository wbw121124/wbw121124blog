<script setup>
const posts = await fetch('/postlist.json').then(res => res.json()).then(data => data.posts);
</script>

<template>
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md mt-6">
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div v-for="post in posts" :key="post.id"
				class="border-l-3 pl-2 border-indigo-500 hover:border-indigo-600 transition-shadow duration-300">
				<a :href="`/?path=/post/${post.id}`" class="block">
					<h3
						class="text-xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-2">
						{{ post.title }}
					</h3>
				</a>
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
			</div>
		</div>
	</div>
</template>
