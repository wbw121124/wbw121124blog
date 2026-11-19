<script setup>
import { ref, onMounted, computed, nextTick, defineProps, watch } from 'vue';
import Fuse from 'fuse.js';
import { withBase } from '../lib/withBase.js';
import fetchJson from '../lib/fetchJson.js';
// 高亮工具与 SearchPage 共用，query 由调用方显式传入
import { highlight, highlightByMatches } from '../lib/searchHighlight.js';
const props = defineProps({
	props: { type: Object, required: true }
});

const query = ref('');
const posts = ref([]);
const results = ref([]);
const page = ref(1);
const pageSize = 5;
let fuse = null;

const state = ref('loading');
const errorMsg = ref('');

// 全文片段：从命中位置向前向后各取 30 字符生成摘要窗口
function snippetFrom(text, matchObj, query) {
	if (!text) return '';
	if (!matchObj || !matchObj.indices || !matchObj.indices.length) {
		const k = query.trim().toLowerCase();
		const lower = text.toLowerCase();
		const idx = lower.indexOf(k);
		if (idx === -1) return '';
		const start = Math.max(0, idx - 30);
		const end = Math.min(text.length, idx + k.length + 30);
		let sn = text.slice(start, end);
		if (start > 0) sn = '...' + sn;
		if (end < text.length) sn = sn + '...';
		return highlight(sn, query);
	}
	// use first match to build snippet window
	const [s, e] = matchObj.indices[0];
	const start = Math.max(0, s - 30);
	const end = Math.min(text.length, e + 30);
	let sn = text.slice(start, end);
	if (start > 0) sn = '...' + sn;
	if (end < text.length) sn = sn + '...';
	// adjust match indices to snippet-relative
	const adj = { indices: [] };
	for (const [ms, me] of matchObj.indices) {
		const rs = Math.max(ms - start, 0);
		const re = Math.min(me - start, sn.length - 1);
		if (re >= 0 && rs < sn.length) adj.indices.push([rs, re]);
	}
	return highlightByMatches(sn, adj);
}

const pagedResults = computed(() => {
	const s = (page.value - 1) * pageSize;
	return results.value.slice(s, s + pageSize);
});
const total = computed(() => results.value.length);
const highlightedResults = computed(() =>
	pagedResults.value.map(p => ({
		...p,
		title: highlightByMatches(p.title, (p._matches || []).find(m => m.key === 'title'), query.value),
		summary: highlightByMatches(p.summary, (p._matches || []).find(m => m.key === 'summary'), query.value),
		snippet: snippetFrom(p.text, (p._matches || []).find(m => m.key === 'text'), query.value)
	}))
);

function runSearch(keys) {
	const q = keys.trim();
	if (!q || !fuse) {
		results.value = [];
		page.value = 1;
		state.value = results.value.length === 0 ? 'empty' : 'success';
		return;
	}
	try {
		let res = fuse.search(q);
		// fuse 返回结果已按相关性排序（score 越小越相关），不要反向排序
		results.value = res.map(r => ({ ...r.item, _score: r.score, _matches: r.matches || [] }));
	} catch (e) {
		results.value = [];
	}
	page.value = 1;
	state.value = results.value.length === 0 ? 'empty' : 'success';
}

// 从 URL 读取 ?page= 初始化分页（缺失或非正整数则 1）
function setPageFromURL() {
	const urlPage = new URLSearchParams(window.location.search).get('page');
	const initPage = parseInt(urlPage, 10);
	if (Number.isInteger(initPage) && initPage >= 1) {
		page.value = initPage;
	}
}

// 把关键词与页码写入 ?q= 与 ?page=，刷新页面时才能还原查询与分页
function writePageURL() {
	window.history.replaceState({}, '', withBase('/searchd/?q=' + encodeURIComponent(query.value.trim()) + '&page=' + page.value));
}

function doSearch() {
	const q = query.value.trim();
	if (!q || !fuse) {
		results.value = [];
		page.value = 1;
		state.value = results.value.length === 0 ? 'empty' : 'success';
		return;
	}
	try {
		let res = fuse.search(q);
		// fuse 返回结果已按相关性排序（score 越小越相关），不要反向排序
		results.value = res.map(r => ({ ...r.item, _score: r.score, _matches: r.matches || [] }));
	} catch (e) {
		results.value = [];
	}
	page.value = 1;
	// 把关键词与页码写进 ?q= 与 ?page= 查询参数，刷新页面时才能还原查询与分页
	if (q) {
		writePageURL();
	}
	state.value = results.value.length === 0 ? 'empty' : 'success';
}

// import data from '../assets/postlist.json';

onMounted(async () => {
	state.value = 'loading';
	try {
		// 单文件全文索引（rp2h.js 生成，按日期降序与 postlist.json 一致），替代逐篇串行 fetch
		const data = await fetchJson(withBase('posts-search.json'));
		// 个别帖子 text 可能缺失，防御为空串
		posts.value = (data.posts || []).map(p => ({ ...p, text: p.text || '' }));
		fuse = new Fuse(posts.value, {
			keys: [
				{ name: 'title', weight: 0.6 },
				{ name: 'summary', weight: 0.15 },
				{ name: 'tags', weight: 0.05 },
				{ name: 'text', weight: 0.2 }
			],
			includeScore: true,
			includeMatches: true,
			threshold: 0.4
		});
		setPageFromURL();
		// 关键词来源优先级：?q= 查询参数（静态页直链）> 路由参数 :keys（旧链接兼容）
		const qParam = new URLSearchParams(window.location.search).get('q');
		const initialKeys = qParam ?? (props.props.keys ? decodeURIComponent(props.props.keys) : '');
		if (initialKeys) {
			nextTick(() => {
				query.value = initialKeys;
				doSearch();
			});
		}
		state.value = results.value.length === 0 ? 'empty' : 'success';
	} catch (err) {
		state.value = 'error';
		errorMsg.value = err.message || String(err);
	}
});

// 分页变化时把页码写入 URL，保持 q 与 page 并存
watch(page, (newPage) => {
	writePageURL();
});
</script>

<template>
	<main class="component">
		<h2 class="text-2xl font-bold mb-4">全文搜索："{{ query }}"</h2>
		<!-- 搜索框：任何状态下始终可见（空结果/加载中/出错都要能改关键词重搜） -->
		<div class="mb-6">
			<el-input v-model="query" placeholder="请输入关键词" class="w-full max-w-md" size="default"
				@keyup.enter.native="doSearch" @blur="doSearch">
				<template #append>
					<el-button size="default" style="border-top-left-radius: 0; border-bottom-left-radius: 0;"
						@click="doSearch" aria-label="搜索">
						<el-icon>
							<i-ep-search />
						</el-icon>
					</el-button>
				</template>
			</el-input>
		</div>
		<!-- 四状态只作用于结果区 -->
		<!-- loading -->
		<div v-if="state === 'loading'" class="text-gray-600 dark:text-gray-300 flex items-center justify-center min-h-[300px]">
			<!-- 等宽四边框保证旋转层对称，修复圆心漂移；motion-reduce 下停止动画 -->
			<!-- 颜色走内联样式：--color-primary 在 :root 而非 @theme，border-primary/25 不会生成 CSS -->
			<div class="animate-spin rounded-full h-8 w-8 border-2 motion-reduce:animate-none" style="border-color: color-mix(in srgb, var(--color-primary) 25%, transparent); border-bottom-color: var(--color-primary);" role="status" aria-label="加载中"></div>
		</div>
		<!-- empty（无关键词提示开始搜索；有关键词但无结果提示未找到） -->
		<div v-else-if="state === 'empty'" class="text-gray-600 dark:text-gray-300 flex items-center justify-center min-h-[300px]">
			<p>{{ query.trim() ? '没有找到匹配的文章。' : '输入关键词开始搜索。' }}</p>
		</div>
		<!-- error -->
		<div v-else-if="state === 'error'" class="text-red-600 flex items-center justify-center min-h-[300px]">
			加载失败：{{ errorMsg }}
		</div>
		<!-- success -->
		<div v-else>
			<div v-if="results.length === 0">
				<p class="text-gray-600 dark:text-gray-300">没有找到匹配的文章。</p>
			</div>
			<div v-else>
				<div v-for="post in highlightedResults" :key="post.id" class="mt-4">
					<a :href="withBase(`/post/${encodeURIComponent(post.id)}/`)" class="text-primary hover:underline" v-html="post.title"></a>
					<span class="text-gray-500 dark:text-gray-400">（{{ post.date }}）</span>
					<p v-if="post.snippet" class="text-gray-600 dark:text-gray-300 line-clamp-2" v-html="post.snippet"></p>
					<p v-else class="text-gray-600 dark:text-gray-300 line-clamp-2" v-html="post.summary"></p>
				</div>
				<el-pagination class="mt-4" background size="small" :page-size="pageSize" :current-page="page"
					:total="total" :hide-on-single-page="true" @current-change="page = $event" />
			</div>
		</div>
	</main>
</template>
