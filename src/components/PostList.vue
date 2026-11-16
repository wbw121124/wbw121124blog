<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { withBase } from '../lib/withBase.js';
import fetchJson from '../lib/fetchJson.js';

const posts = ref([]);
const perPage = 10; // 默认每页10个
const currentPage = ref(1);

// 初始化 currentPage 从 URL ?page= 读取（缺失或非正整数则 1）
const urlPage = new URLSearchParams(window.location.search).get('page');
const initPage = parseInt(urlPage, 10);
if (Number.isInteger(initPage) && initPage >= 1) {
	currentPage.value = initPage;
}

const state = ref('loading');
const errorMsg = ref('');

const pagedPosts = computed(() => {
	const start = (currentPage.value - 1) * perPage;
	return posts.value.slice(start, start + perPage);
});

// 分页变化时把页码写入 URL，保持刷新后定位到当前页
watch(currentPage, (newPage) => {
	window.history.replaceState({}, '', withBase('/?page=' + newPage));
});

// load data
onMounted(async () => {
	state.value = 'loading';
	try {
		const data = await fetchJson(withBase('postlist.json'));
		posts.value = data.posts || [];
		state.value = posts.value.length === 0 ? 'empty' : 'success';
	} catch (err) {
		state.value = 'error';
		errorMsg.value = err.message || String(err);
	}
});
</script>

<template>
	<main class="component">
		<!-- loading -->
		<div v-if="state === 'loading'" class="text-gray-600 flex items-center justify-center min-h-[300px]">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
		<!-- empty（数据加载成功但无内容） -->
		<div v-else-if="state === 'empty'" class="text-gray-600 flex items-center justify-center min-h-[300px]">
			暂无数据。
		</div>
		<!-- error -->
		<div v-else-if="state === 'error'" class="text-red-600 flex items-center justify-center min-h-[300px]">
			加载失败：{{ errorMsg }}
		</div>
		<!-- success -->
		<div v-else>
			<div v-for="post in pagedPosts" :key="post.id" class="transition-shadow duration-300 mt-6">
				<div class="block component transition-colors">
					<h3 class="LXGWNeoXiHeiPlus text-xl font-bold text-primary mb-2">
						<a :href="withBase(`/post/${encodeURIComponent(post.id)}/`)">{{ post.title }}</a>
					</h3>
					<p class="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{{ post.summary }}</p>
					<div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
						<span>{{ post.date }}</span>
						<div class="flex flex-wrap gap-1">
							<span v-for="tag in post.tags" :key="tag" class="tag">
								<a :href="withBase(`/tag/${encodeURIComponent(tag)}/`)">{{ tag }}</a>
							</span>
						</div>
					</div>
				</div>
			</div>


			<!-- 分页控件 -->
			<div class="mt-8 flex justify-center">
				<el-pagination background size="small" :page-size="perPage" :current-page="currentPage" :total="posts.length"
					:hide-on-single-page="true" @current-change="currentPage = $event" />
			</div>
		</div>
	</main>
</template>
