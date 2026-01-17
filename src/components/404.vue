<template>
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md">
		<h2 class="text-2xl font-bold mb-6">404</h2>
		<p class="text-gray-600 dark:text-gray-400 mb-4">抱歉，您访问的页面不存在。</p>
		<div class="flex space-x-4 mb-6">
			<button @click="goHome" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">返回首页</button>
			<button @click="goBack" class="px-4 py-2 bg-white dark:bg-gray-800 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950">返回上一页</button>
		</div>
	</div>
</template>

<script setup>
const goHome = () => {
	window.location.href = '/';
};
const goBack = () => {
	window.history.back();
};
</script>