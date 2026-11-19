<script setup>
import { ref, onMounted } from 'vue';
import { withBase } from '../lib/withBase.js';
import fetchJson from '../lib/fetchJson.js';
const tags = ref([]);
const data = ref({});
const state = ref('loading');
const errorMsg = ref('');

onMounted(async () => {
	state.value = 'loading';
	try {
		data.value = await fetchJson(withBase('tags.json'));
		tags.value = Object.keys(data.value.tags).sort();
		state.value = tags.value.length === 0 ? 'empty' : 'success';
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
			暂无标签。
		</div>
		<!-- error -->
		<div v-else-if="state === 'error'" class="text-red-600 flex items-center justify-center min-h-[300px]">
			加载失败：{{ errorMsg }}
		</div>
		<!-- success -->
		<div v-else>
			<h2 class="text-2xl font-bold mb-6">所有标签</h2>
			<div class="flex flex-wrap gap-2">
				<span v-for="tag in tags" :key="tag" class="tag"><a :href="withBase(`/tag/${encodeURIComponent(tag)}/`)">{{ tag }}</a> {{ data.tags[tag] }}</span>
			</div>
		</div>
	</main>
</template>
