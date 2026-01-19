<script setup>
import { defineAsyncComponent } from 'vue';
const PostList = defineAsyncComponent(() => import('./PostList.vue'));
</script>

<template>
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md">
		<h2 class="text-2xl font-bold mb-6">欢迎来到 wbw121124blog</h2>
		<!--计数器 ID:wp9umuzk 控制面板访问密钥:gap0vog1-->
		<img src="https://w.saobby.com/w/wp9umuzk" height="0" width="0"
			style="position: fixed; z-index: -2147483648; opacity: 0;" alt="网站访问统计" />
		<p class="text-gray-600 dark:text-gray-400 mb-4">这是一个基于 Vue 3 和 Vite 构建的博客网站。</p>
	</div>

	<Suspense>
		<PostList />
	</Suspense>
</template>
