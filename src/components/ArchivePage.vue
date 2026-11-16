<script setup>
import { ref, onMounted } from 'vue';
import { withBase } from '../lib/withBase.js';
import fetchJson from '../lib/fetchJson.js';
const posts = ref([]);
const grouped = ref({});
const state = ref('loading');
const errorMsg = ref('');

onMounted(async () => {
	state.value = 'loading';
	try {
		const data = await fetchJson(withBase('postlist.json'));
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
		state.value = Object.keys(grouped.value).length === 0 ? 'empty' : 'success';
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
			暂无归档文章。
		</div>
		<!-- error -->
		<div v-else-if="state === 'error'" class="text-red-600 flex items-center justify-center min-h-[300px]">
			加载失败：{{ errorMsg }}
		</div>
		<!-- success -->
		<div v-else>
			<h2 class="text-2xl font-bold mb-6">文章归档</h2>
			<div v-for="(months, year) in grouped" :key="year">
				<h3 class="text-xl font-semibold">{{ -year }}</h3>
				<el-timeline mode="start" class="pt-2">
					<el-timeline-item v-for="(posts, ym) in months" :key="ym" placement="top" :timestamp="ym">
						<el-card shadow="hover">
							<div v-for="post in posts" :key="post.id">
								<a :href="withBase(`/post/${encodeURIComponent(post.id)}/`)" class="href hover:underline">{{ post.title }}</a>
								<span class="text-gray-500">（{{ post.date }}）</span>
								<span v-if="post.tags">
									:
									<span class="inline-flex flex-wrap gap-1">
										<span v-for="tag in post.tags" :key="tag" class="tag">
											<a :href="withBase(`/tag/${encodeURIComponent(tag)}/`)">{{ tag }}</a>
										</span>
									</span>
								</span>
							</div>
						</el-card>
					</el-timeline-item>
				</el-timeline>
			</div>
		</div>
	</main>
</template>
