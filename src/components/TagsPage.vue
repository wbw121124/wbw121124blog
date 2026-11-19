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
			<!-- 等宽四边框保证旋转层对称，修复圆心漂移；motion-reduce 下停止动画 -->
			<!-- 颜色走内联样式：--color-primary 在 :root 而非 @theme，border-primary/25 不会生成 CSS -->
			<div class="animate-spin rounded-full h-8 w-8 border-2 motion-reduce:animate-none" style="border-color: color-mix(in srgb, var(--color-primary) 25%, transparent); border-bottom-color: var(--color-primary);" role="status" aria-label="加载中"></div>
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
