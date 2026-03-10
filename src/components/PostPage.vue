<script setup>
// 获取组件 props
// import { defineProps } from 'vue';
// 定义 Props
const props = defineProps({
	props: {
		type: Object,
		required: true  // 必需的 Props
	}
});
import { onMounted, ref, watch, nextTick, h, createApp } from 'vue';
import { CopyDocument } from '@element-plus/icons-vue';
import { loadMarkdownIt } from '/src/main.js';
const postContent = ref('加载中...');
const rawMarkdown = ref(''); // 保存原始 markdown 文本
const isLoading = ref(true);
// start with empty metadata; 'ready' flag will be added after parsing
const metadata = ref({});

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

// 异步加载并使用markdown-it
onMounted(async () => {
	try {
		const postName = props.props.name;
		const response = await fetch(`./posts/${postName}.md`);
		if (!response.ok) {
			postContent.value = '文章未找到。';
			isLoading.value = false;
			return;
		}
		const text = await response.text();
		const { metadata: _metadata, content: markdown } = parseFrontmatter(text, postName);
		// 保存原始 markdown 以便复制
		rawMarkdown.value = markdown;
		const module = await loadMarkdownIt();
		const mdit = await module.initMarkdownIt();
		postContent.value = mdit.render(markdown);
		// mark metadata as ready so template can display it
		_metadata.ready = true;
		metadata.value = _metadata;
		isLoading.value = false;
		// 添加代码块复制按钮
		addCopyButtons();
	} catch (error) {
		const message = error instanceof Error ? error.message + '\n' + error.stack : String(error);
		// 转义 HTML 标签
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
							onClick: copyCode
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

</script>

<template>
	<main class="mkd component mt-6">
		<div v-if="metadata !== null && metadata.ready === true" class="metadata">
			<h2>{{ metadata.title }}</h2>
			<div v-if="metadata.tags && metadata.tags.length" class="flex flex-wrap gap-1 mt-1">
				<span v-for="t in metadata.tags" :key="t" class="tag">
					<a :href="`?path=/tag/${encodeURIComponent(t)}`">{{ t }}</a>
				</span>
			</div>
			<p>作者: {{ metadata.author || 'wbw121124' }}</p>
			<p>发布时间: {{ metadata.date || 'Unknow' }}</p>
			<p>协议: <a
					:href="'https://creativecommons.org/licenses/' + (metadata.license || 'BY-NC-SA') + '/4.0/deed.zh-hans'">CC&ThinSpace;{{
						metadata.license || 'BY-NC-SA' }}&ThinSpace;4.0</a></p>
		</div>
		<div v-if="isLoading" class="text-center py-8">
			<div
				class="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-gray-900 dark:border-b-white mx-auto">
			</div>
			<p class="mt-2 text-gray-600 dark:text-gray-400">正在加载文章...</p>
		</div>
		<div v-else>
			<div class="mb-4 flex justify-end">
				<el-button @click="copyMarkdown" class="btn-copy-md text-sm px-3 py-1">
					<el-icon>
						<copy-document />
					</el-icon>
				</el-button>
				<el-button @click="editMarkdown" class="btn-copy-md text-sm px-3 py-1">
					<el-icon>
						<Edit />
					</el-icon>
				</el-button>
			</div>
			<div v-html="postContent || '内容加载失败。'"></div>
		</div>
	</main>
</template>
