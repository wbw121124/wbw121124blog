<script setup>
import 'katex/dist/contrib/copy-tex.mjs';
// 获取组件 props
// import { defineProps } from 'vue';
// 定义 Props
const props = defineProps({
	props: {
		type: Object,
		required: true  // 必需的 Props
	}
});
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { withBase } from '../lib/withBase.js';
import fetchJson from '../lib/fetchJson.js';
const postContent = ref('加载中...');
const rawMarkdown = ref(''); // 保存原始 markdown 文本
const isLoading = ref(true);
// start with empty metadata; 'ready' flag will be added after parsing
const metadata = ref({ ready: false });

// GitHub 仓库常量：编辑链接与仓库地址统一维护
const GITHUB_REPO = 'wbw121124/wbw121124blog';

// 读取构建期嵌入的文章数据（buildPages 注入的 post-data 数据块）；dev 模式无此块返回 null
// <script type="application/json"> 是数据块不是可执行脚本，CSP script-src 'self' 不拦截
function readEmbeddedPost() {
	const el = document.getElementById('post-data');
	if (!el) return null;
	try {
		return JSON.parse(el.textContent || '');
	} catch (e) {
		console.error('post-data 数据块解析失败，回退运行时 fetch', e);
		return null;
	}
}

// setup 顶部同步读取嵌入数据（必须发生在任何 await 之前）：静态页直接用构建期 HTML，消除加载闪烁
const embeddedPost = readEmbeddedPost();

if (embeddedPost) {
	// 同步消费嵌入数据，不等挂载、不发网络请求
	postContent.value = embeddedPost.html || '文章内容为空。';
	rawMarkdown.value = embeddedPost.markdown || '';
	const _metadata = { ...(embeddedPost.metadata || {}), ready: true };
	metadata.value = _metadata;
	isLoading.value = false;
	// 浏览器标题跟随文章（SEO 与历史记录可读性）
	if (_metadata.title) document.title = `${_metadata.title} - wbw121124's blog`;
}

// 滚动到 URL hash 对应的锚点（嵌入与 fetch 两条路径共用；延迟等待渲染与图片布局稳定）
function scrollToHash() {
	nextTick(() => {
		const hash = window.location.hash;
		if (hash) {
			setTimeout(() => {
				const target = document.querySelector(hash.replace(/%/g, '\\%'));
				if (target) {
					window.smoothScrollToElement(target);
				}
			}, 500);
		}
	});
}

// 异步加载文章内容（使用服务端预渲染结果）；构建期已嵌入数据时整体跳过 fetch
onMounted(async () => {
	// 静态页：嵌入数据已在 setup 顶部同步消费，这里只需补挂复制按钮并处理锚点跳转
	if (embeddedPost) {
		// watch(postContent) 非 immediate，嵌入场景赋值发生在 watch 注册前不会再触发，需手动补一次
		addCopyButtons();
		scrollToHash();
		return;
	}

	// dev 模式回退：运行时 fetch 文章 JSON（fetchJson 统一封装：res.ok 校验 + 超时 + 重试）
	try {
		const postName = props.props.name;
		const data = await fetchJson(withBase(`posts-html/${postName}.json`));

		if (!data) {
			throw new Error('文章预渲染数据加载失败');
		}

		rawMarkdown.value = data.markdown || '';
		postContent.value = data.html || '文章内容为空。';
		const _metadata = data.metadata || {};
		_metadata.ready = true;
		metadata.value = _metadata;
		isLoading.value = false;
		// 浏览器标题跟随文章（SEO 与历史记录可读性）
		if (_metadata.title) document.title = `${_metadata.title} - wbw121124's blog`;

		addCopyButtons();
		// 跳转到锚点
		scrollToHash();
	} catch (error) {
		// 只向用户展示错误消息，不泄露堆栈
		const message = error instanceof Error ? error.message : String(error);
		const escapedMessage = message.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

		postContent.value = '加载文章时出错：<pre><code>' + escapedMessage + '</code></pre>';
		isLoading.value = false;
	}
});

// 在文章渲染后查找所有代码块并加上复制按钮
function addCopyButtons() {
	nextTick(() => {
		const container = document.querySelector('.mkd.component');
		if (!container) return;

		container.querySelectorAll(':not(.twoslash-popup-code)>pre:has(code)').forEach(pre => {
			if (pre.querySelector('.copy-btn')) return; // 避免重复添加
			// 生成一个挂载容器，用于 Vue 挂载组件
			const wrapper = document.createElement('div');
			const btn = document.createElement('button');
			btn.className = "el-button el-button--default copy-btn text-sm px-3 py-1";
			btn.ariaLabel = "复制代码";
			btn.ariaDisabled = false;
			btn.innerHTML = `<i class="el-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64z"></path><path fill="currentColor" d="M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64"></path></svg></i>`;

			btn.addEventListener('click', () => {
				navigator.clipboard.writeText(btn.parentElement.parentElement.querySelector('code').innerText).then(() => {
					ElNotification({
						title: '代码已复制到剪贴板',
						type: 'success',
					})
				}).catch((e) => {
					console.error(e);
					ElNotification({
						title: '错误',
						type: 'error',
						message: e.message || '复制失败，请检查浏览器剪贴板权限'
					})
				});
			});
			wrapper.appendChild(btn);
			pre.appendChild(wrapper);
		});
		// 为所有 .twoslash-popup-container 元素添加事件监听
		document.querySelectorAll('.twoslash-popup-container').forEach(container => {
			const trigger = container.parentElement; // 通常是触发hover的父元素
			// dataset 防重：watch 每次触发 addCopyButtons 都会对同批元素重复绑定，这里跳过已绑定的
			if (!container || !trigger || trigger.dataset.popupBound) return;
			trigger.dataset.popupBound = '1';

			// 方式1：鼠标移入时计算（父元素触发）
			trigger.addEventListener('mouseenter', () => {
				updateTwoslashPopupPositions();
			});
		});
	});
}

// 计算 twoslash 弹窗触发元素相对视口的位置，写入 CSS 变量（供 mouseenter 与 scroll 共用）
function updateTwoslashPopupPositions() {
	document.querySelectorAll('.twoslash-popup-container').forEach(container => {
		const trigger = container.parentElement;
		if (!trigger) return;
		const rect = trigger.getClientRects()[0];
		if (!rect) return;
		const distanceToLeft = rect.left,
			distanceToRight = window.innerWidth - rect.right,
			distanceToTop = rect.top;

		// 设置 CSS 变量 --x
		container.style.setProperty('--x', `${distanceToLeft}px`);
		// 设置 CSS 变量 --x1
		container.style.setProperty('--x1', `${distanceToRight}px`);
		// 设置 CSS 变量 --top
		container.style.setProperty('--top', `${distanceToTop}px`);
	});
}

// scroll 的 rAF 节流包装：滚动触发时若已有 pending 帧则跳过，帧内统一更新弹窗位置
let rafId = null;
function onScrollRaf() {
	if (rafId !== null) return;
	rafId = requestAnimationFrame(() => {
		rafId = null;
		updateTwoslashPopupPositions();
	});
}

// 挂载时注册滚动监听（passive，不阻塞滚动合成线程），卸载时成对移除
onMounted(() => {
	document.addEventListener('scroll', onScrollRaf, { passive: true });
});

onUnmounted(() => {
	document.removeEventListener('scroll', onScrollRaf);
	if (rafId !== null) cancelAnimationFrame(rafId);
});

function copyMarkdown() {
	if (!rawMarkdown.value) return;
	navigator.clipboard.writeText(rawMarkdown.value).then(() => {
		ElNotification({
			title: 'Markdown 已复制到剪贴板',
			type: 'success',
		})
	}).catch((e) => {
		console.error(e);
		ElNotification({
			title: '错误',
			type: 'error',
			message: e.message || '复制失败，请检查浏览器剪贴板权限'
		})
	});
}

function editMarkdown() {
	const postName = props.props.name;
	window.open('https://github.com/' + GITHUB_REPO + '/edit/master/public/posts/' + postName + '.md');
}

watch(postContent, () => {
	addCopyButtons();
});
</script>

<template>
	<main class="mkd component mt-6">
		<div v-if="metadata !== null && metadata.ready === true" class="metadata" key="loading">
			<h2 class="LXGWNeoXiHeiPlus">{{ metadata.title }}</h2>
			<div v-if="metadata.tags && metadata.tags.length" class="flex flex-wrap gap-1 mt-1" key="tags">
				<span v-for="t in metadata.tags" :key="t" class="tag">
					<a :href="withBase(`/tag/${encodeURIComponent(t)}/`)">{{ t }}</a>
				</span>
			</div>
			<p>作者: {{ metadata.author || 'wbw121124' }}</p>
			<p>发布时间: {{ metadata.date || 'Unknow' }}</p>
			<p>协议: <a
					:href="'https://creativecommons.org/licenses/' + (metadata.license || 'BY-SA') + '/4.0/deed.zh-hans'">CC&ThinSpace;{{
						metadata.license || 'BY-SA' }}&ThinSpace;4.0</a></p>
		</div>
		<div v-if="isLoading" class="text-center py-8" key="loading">
			<!-- 等宽四边框保证旋转层对称，修复圆心漂移；颜色用内联 color-mix（Tailwind v4 CSS-first 下 :root 变量不生成颜色工具类） -->
			<div class="animate-spin rounded-full h-8 w-8 border-2 mx-auto"
				style="border-color: color-mix(in srgb, var(--color-primary) 25%, transparent); border-bottom-color: var(--color-primary);"
				role="status" aria-label="加载中">
			</div>
			<p class="mt-2 text-gray-600 dark:text-gray-400">正在加载文章...</p>
		</div>
		<div v-else key="content">
			<div class="mb-4 flex justify-end">
				<el-button @click="copyMarkdown" class="text-sm px-3 py-1" circle type="success"
					aria-label="复制 Markdown">
					<el-icon>
						<i-ep-copy-document />
					</el-icon>
				</el-button>
				<el-button @click="editMarkdown" class="text-sm px-3 py-1" circle type="primary" aria-label="编辑">
					<el-icon>
						<i-ep-edit />
					</el-icon>
				</el-button>
			</div>
			<div v-html="postContent || '内容加载失败。'"></div>
		</div>
	</main>
</template>
