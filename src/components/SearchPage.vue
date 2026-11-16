<script setup>
import { ref, onMounted, computed, nextTick, defineProps, watch } from 'vue';
import Fuse from 'fuse.js';
import { withBase } from '../lib/withBase.js';
import fetchJson from '../lib/fetchJson.js';
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

// HTML 转义（与 PostPage.vue 的转义写法保持一致，& 必须放最前避免二次转义）
function escapeHtml(str) {
	return str.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// 单字符转义：给 highlightByMatches 按字符拼接时用，不改变其余索引逻辑
function escapeHtmlChar(ch) {
	switch (ch) {
		case '&': return '&amp;';
		case '<': return '&lt;';
		case '>': return '&gt;';
		case '"': return '&quot;';
		case '\'': return '&#39;';
		default: return ch;
	}
}

function highlight(text) {
	if (!text) return '';
	const k = query.value.trim().replace(/ /g, '');
	if (!k) return escapeHtml(text);
	const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${esc})`, 'gi');
	// 先做 HTML 转义再匹配高亮，防止标题/摘要里的 <、>、& 被浏览器当标签吞掉
	return escapeHtml(text).replace(/ /g, '').replace(regex, '<mark>$1</mark>');
}

function highlightByMatches(text, matchObj) {
	if (!text) return '';
	if (!matchObj || !matchObj.indices || !matchObj.indices.length) {
		return highlight(text);
	}
	const chars = Array.from(text);
	const markers = new Array(chars.length).fill(false);
	for (const [s, e] of matchObj.indices) {
		for (let i = s; i <= e && i < markers.length; i++) markers[i] = true;
	}
	let out = '';
	let inMark = false;
	for (let i = 0; i < chars.length; i++) {
		if (markers[i] && !inMark) { out += '<mark>'; inMark = true; }
		if (!markers[i] && inMark) { out += '</mark>'; inMark = false; }
		// 逐字符转义后再拼接：整体先转义会改变长度，导致 match 索引错位
		out += escapeHtmlChar(chars[i]);
	}
	if (inMark) out += '</mark>';
	return out;
}

const pagedResults = computed(() => {
	const start = (page.value - 1) * pageSize;
	return results.value.slice(start, start + pageSize);
});

const highlightedResults = computed(() =>
	pagedResults.value.map(p => ({
		...p,
		title: highlightByMatches(p.title, (p._matches || []).find(m => m.key === 'title')),
		summary: highlightByMatches(p.summary, (p._matches || []).find(m => m.key === 'summary'))
	}))
);

const total = computed(() => results.value.length);

function runSearch(keys) {
	const k = keys.trim();
	if (!k || !fuse) {
		results.value = [];
		state.value = results.value.length === 0 ? 'empty' : 'success';
		return;
	}
	try {
		let res = fuse.search(k);
		// fuse 返回结果已按相关性排序（score 越小越相关），不要反向排序
		results.value = res.map(r => ({ ...r.item, _score: r.score, _matches: r.matches || [] }));
	} catch (e) {
		results.value = [];
	}
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
	window.history.replaceState({}, '', withBase('/search/?q=' + encodeURIComponent(query.value.trim()) + '&page=' + page.value));
}

// import data from '../assets/postlist.json';

onMounted(async () => {
	state.value = 'loading';
	try {
		const data = await fetchJson(withBase('postlist.json'));
		posts.value = data.posts.sort((a, b) => b.date.localeCompare(a.date));
		fuse = new Fuse(posts.value, {
			keys: [
				{ name: 'title', weight: 0.6 },
				{ name: 'summary', weight: 0.3 },
				{ name: 'tags', weight: 0.1 }
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
				runSearch(query.value);
			});
		} else {
			state.value = results.value.length === 0 ? 'empty' : 'success';
		}
	} catch (err) {
		state.value = 'error';
		errorMsg.value = err.message || String(err);
	}
});

function doSearch() {
	if (query.value.trim()) {
		page.value = 1;
		// 关键词与页码写入 ?q= 与 ?page=，刷新页面时才能还原查询
		writePageURL();
		runSearch(query.value);
	}
}

// 分页变化时把页码写入 URL，保持 q 与 page 并存
watch(page, (newPage) => {
	writePageURL();
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
			没有找到匹配的文章。
		</div>
		<!-- error -->
		<div v-else-if="state === 'error'" class="text-red-600 flex items-center justify-center min-h-[300px]">
			加载失败：{{ errorMsg }}
		</div>
		<!-- success -->
		<div v-else>
			<h2 class="text-2xl font-bold mb-4">搜索："{{ query }}"</h2>
			<div class="mb-6 flex items-center gap-2">
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
				<a v-if="query" :href="withBase(`/searchd/?q=${encodeURIComponent(query)}`)"
					class="text-sm href hover:underline">全文搜索</a>
			</div>
			<div v-if="results.length === 0">
				<p class="text-gray-600">没有找到匹配的文章。</p>
			</div>
			<div v-else>
				<div v-for="post in highlightedResults" :key="post.id" class="mt-4">
					<a :href="withBase(`/post/${encodeURIComponent(post.id)}/`)" class="text-primary hover:underline" v-html="post.title"></a>
					<span class="text-gray-500">（{{ post.date }}）</span>
					<p class="text-gray-600 line-clamp-2" v-html="post.summary"></p>
				</div>
				<el-pagination class="mt-4" background size="small" :page-size="pageSize" :current-page="page"
					:total="total" :hide-on-single-page="true" @current-change="page = $event" />
			</div>
		</div>
	</main>
</template>
