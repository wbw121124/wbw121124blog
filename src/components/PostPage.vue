<script setup>
import '../katex/copy-tex.min.js';
// 获取组件 props
// import { defineProps } from 'vue';
// 定义 Props
const props = defineProps({
	props: {
		type: Object,
		required: true  // 必需的 Props
	}
});
import { onMounted, onUnmounted, ref, watch, nextTick, h, createApp } from 'vue';
import { CopyDocument } from '@element-plus/icons-vue';
// import { loadMarkdownIt } from '/src/main.js';
const postContent = ref('加载中...');
const rawMarkdown = ref(''); // 保存原始 markdown 文本
const isLoading = ref(true);
// start with empty metadata; 'ready' flag will be added after parsing
const metadata = ref({ ready: false });

// 解析 frontmatter
function parseFrontmatter(content, postName) {
	if (!content.startsWith("\<!--"))
		return { metadata: { title: postName }, content };

	// kmp 算法
	function getNext(pattern) {
		const next = Array(pattern.length).fill(0)
		for (let i = 1, j = 0; i < pattern.length; i++) {
			while (j > 0 && pattern[i] !== pattern[j]) {
				j = next[j - 1]
			}
			if (pattern[i] === pattern[j]) {
				j++
			}
			next[i] = j
		}
		return next
	}

	const pattern = "--\>";
	const next = getNext(pattern)
	let j = 0
	let endIndex = -1
	for (let i = 0; i < content.length; i++) {
		while (j > 0 && content[i] !== pattern[j]) {
			j = next[j - 1]
		}
		if (content[i] === pattern[j]) {
			j++
		}
		if (j === pattern.length) {
			endIndex = i + 1
			break
		}
	}

	const frontmatter = content.substring(4, endIndex - 3).trim()
	const body = content.substring(endIndex).trim()
	const metadata = {}

	frontmatter.split('\n').forEach(line => {
		const [key, ...values] = line.split(':')
		if (key && values.length) {
			metadata[key.trim()] = values.join(':').trim()
		}
	})

	// convert tags string to array if present
	if (metadata.tags) {
		try {
			// assume JSON-like list
			metadata.tags = JSON.parse(metadata.tags.replace(/'/g, '"'))
		} catch (e) {
			// fallback comma split
			metadata.tags = metadata.tags.replace(/\[|\]/g, '').split(/\s*,\s*/).filter(Boolean)
		}
	}

	return { metadata, content: body }
}

function isJSON(str) {
	if (typeof str !== 'string') return false;
	try {
		const obj = JSON.parse(str);
		return typeof obj === 'object' && obj !== null;
	} catch (e) {
		return false;
	}
}

// 异步加载文章内容（使用服务端预渲染结果）
onMounted(async () => {
	try {
		const postName = props.props.name;
		let data;
		const response = await fetch(`./posts-html/${postName}.json`);
		if (response.ok)
			data = await response.text();
		if (response.ok && isJSON(data)) {
			data = JSON.parse(data);
		} /*else {
			// 兼容旧版：还没渲染时回退到 md
			const mdResp = await fetch(`./posts/${postName}.md`);
			if (!mdResp.ok) {
				postContent.value = '文章未找到。';
				isLoading.value = false;
				return;
			}
			const text = await mdResp.text();
			const { metadata: _metadata, content: markdown } = parseFrontmatter(text, postName);
			rawMarkdown.value = markdown;
			await window.loadMarkdownIt();
			console.log('Markdown-it module loaded');
			const module = window.markdownItModule;
			const mdit = await module.initMarkdownIt();
			postContent.value = mdit.render(markdown);
			_metadata.ready = true;
			metadata.value = _metadata;
			isLoading.value = false;
			return;
		}*/

		if (!data) {
			throw new Error('文章预渲染数据加载失败');
		}

		rawMarkdown.value = data.markdown || '';
		postContent.value = data.html || '文章内容为空。';
		const _metadata = data.metadata || {};
		_metadata.ready = true;
		metadata.value = _metadata;
		isLoading.value = false;
		// 跳转到锚点
		nextTick(() => {
			const hash = window.location.hash;
			if (hash) {
				setTimeout(() => {
					const target = document.querySelector(hash.replace(/%/g, '\\%'));
					console.log(hash.replace(/%/g, '\\%'), target);
					if (target) {
						window.smoothScrollToElement(target);
					}
				}, 500);
			}
		});
	} catch (error) {
		const message = error instanceof Error ? error.message + '\n' + error.stack : String(error);
		const escapedMessage = message.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

		postContent.value = '加载文章时出错：<pre><code>' + escapedMessage + '</code></pre>';
		isLoading.value = false;
	}
});

// 存储所有创建的按钮应用实例
const buttonApps = ref([]);

// 销毁所有已存在的按钮应用
function destroyAllButtonApps() {
	buttonApps.value.forEach(app => {
		try {
			app.unmount();
		} catch (e) {
			console.warn('Failed to unmount button app:', e);
		}
	});
	buttonApps.value = [];
}


// 在文章渲染后查找所有代码块并加上复制按钮
function addCopyButtons() {
	nextTick(() => {
		const container = document.querySelector('.mkd.component');
		if (!container) return;

		// 在重新创建前销毁所有旧的按钮应用
		destroyAllButtonApps();

		container.querySelectorAll('pre:has(code)').forEach(pre => {
			if (pre.querySelector('.copy-btn')) return; // 避免重复添加
			// 生成一个挂载容器，用于 Vue 挂载组件
			const wrapper = document.createElement('div');
			pre.style.position = 'relative'; // 确保父元素定位
			pre.appendChild(wrapper);

			// 点击逻辑抽成函数，作用于当前 pre
			const copyCode = () => {
				const codeElem = pre.querySelector('code');
				const codeText = codeElem ? codeElem.innerText : pre.innerText;
				navigator.clipboard.writeText(codeText).then(() => {
					const btnEl = wrapper.querySelector('button');
					if (btnEl) {
						btnEl.innerText = '已复制';
						setTimeout(() => (btnEl.innerText = '复制'), 2000);
					}
				});
			};

			// 创建 Vue 应用实例，渲染 el-button
			const btnApp = createApp({
				render() {
					return h(
						'el-button',
						{
							class: 'el-button copy-btn text-sm px-3 py-1',
							onClick: copyCode,
							'aria-label': '复制代码'
						},
						[
							h('i',
								{
									class: 'el-icon'
								}, h(CopyDocument))
						]
					);
				}
			});

			// 直接挂载实例，后续 DOM 操作使用 wrapper
			btnApp.mount(wrapper);
			buttonApps.value.push(btnApp);
		});
	});
}

function copyMarkdown() {
	if (!rawMarkdown.value) return;
	navigator.clipboard.writeText(rawMarkdown.value).then(() => {
		console.log('Markdown 已复制到剪贴板');
	});
}

function editMarkdown() {
	const postName = props.props.name;
	window.open('https://github.com/wbw121124/wbw121124blog/edit/master/public/posts/' + postName + '.md');
}

watch(postContent, () => {
	addCopyButtons();
});

// 组件卸载时清理所有按钮应用
onUnmounted(() => {
	destroyAllButtonApps();
});

</script>

<template>
	<main class="mkd component mt-6">
		<div v-if="metadata !== null && metadata.ready === true" class="metadata" key="loading">
			<h2 class="LXGWNeoXiHeiPlus">{{ metadata.title }}</h2>
			<div v-if="metadata.tags && metadata.tags.length" class="flex flex-wrap gap-1 mt-1" key="tags">
				<span v-for="t in metadata.tags" :key="t" class="tag">
					<a :href="`?path=/tag/${encodeURIComponent(t)}`">{{ t }}</a>
				</span>
			</div>
			<p>作者: {{ metadata.author || 'wbw121124' }}</p>
			<p>发布时间: {{ metadata.date || 'Unknow' }}</p>
			<p>协议: <a
					:href="'https://creativecommons.org/licenses/' + (metadata.license || 'BY-SA') + '/4.0/deed.zh-hans'">CC&ThinSpace;{{
						metadata.license || 'BY-SA' }}&ThinSpace;4.0</a></p>
		</div>
		<div v-if="isLoading" class="text-center py-8" key="loading">
			<div
				class="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-gray-900 dark:border-b-white mx-auto">
			</div>
			<p class="mt-2 text-gray-600 dark:text-gray-400">正在加载文章...</p>
		</div>
		<div v-else key="content">
			<div class="mb-4 flex justify-end">
				<el-button @click="copyMarkdown" class="btn-copy-md text-sm px-3 py-1" circle type="success"
					aria-label="复制 Markdown">
					<el-icon>
						<copy-document />
					</el-icon>
				</el-button>
				<el-button @click="editMarkdown" class="btn-copy-md text-sm px-3 py-1" circle type="primary"
					aria-label="编辑">
					<el-icon>
						<Edit />
					</el-icon>
				</el-button>
			</div>
			<div v-html="postContent || '内容加载失败。'"></div>
		</div>
	</main>
</template>
