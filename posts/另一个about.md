<!--
title: 另一个about
date: 2026-04-14
tags: [关于,杂谈,言论]
-->

# 另一个about

::: info[==快去点个 star:star:！==]{open}

emoji :-) :100: :satellite:

采用 GNU通用公共许可证 (GPL) 第3版 授权。详见 [LICENSE.md](https://github.com/wbw121124/wbw121124blog/blob/master/LICENSE.md) 文件。

~~light mode 让我眼睛瞎了~~

这是一个基于 Vue 3 和 Vite 构建的博客网站，使用作者自己编写的博客框架。

:::

::: info
hi
:::

::: success
hi
:::

::: warning
hi
:::

::: error
hi
:::

::: danger
hi
:::

::: details
hi
:::

[![Optimized Blog CI/CD](https://github.com/wbw121124/wbw121124blog/actions/workflows/pages.yml/badge.svg)](https://github.com/wbw121124/wbw121124blog/actions/workflows/pages.yml)[![pages-build-deployment](https://github.com/wbw121124/wbw121124blog/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/wbw121124/wbw121124blog/actions/workflows/pages/pages-build-deployment)

```ts
// [!code word:console:1]
console.log('No errors or warnings')
console.error('Error') // [!code error] [!code --]
console.warn('Warning') // [!code warning] [!code ++]
```

```ts
console.log('hewwo') // [!code --]
console.log('hello') // [!code ++]
console.log('goodbye')
```

```ts
console.log('Not highlighted')
console.log('Highlighted') // [!code highlight]
console.log('Not highlighted')
```

```ts
// [!code highlight:2]
console.log('Highlighted')
console.log('Highlighted')
console.log('Not highlighted')
```

```ts
console.log('Not highlighted')
// [!code highlight:1]
console.log('Highlighted')
console.log('Not highlighted')
```

```ts
// [!code word:Hello]
const message = 'Hello World'
console.log(message) // prints Hello World
```

```ts
// [!code word:Hello:1]
const message = 'Hello World'
console.log(message) // prints Hello World
```

```ts
console.log('Not focused');
console.log('Focused') // [!code focus]
console.log('Not focused');
```

```ts
// [!code focus:2]
console.log('Focused')
console.log('Focused')
console.log('Not focused')
```

```ts
console.log('No errors or warnings')
console.error('Error') // [!code error]
console.warn('Warning') // [!code warning]
```

```js {1,3-4}
console.log('1')
console.log('2')
console.log('3')
console.log('4')
```

```js /Hello/
const msg = 'Hello World'
console.log(msg)
console.log(msg) // 打印 Hello World
```

```ts twoslash
console.log('normal typescript twoslash')
```

```ts
console.log('normal eslint twoslash')
const unused = 1

type Foo = {
  bar: string
}
```

```ts
// @errors: 2339
let x: [string, number]
x = ['hello', 10] // OK
// ---cut---
console.log(x[0].substring(1))
console.log(x[1].substring(1))
```

```vue
<script setup>
import { ref, onMounted, computed, nextTick, defineProps } from 'vue';
import Fuse from 'fuse.js';
const props = defineProps({
	props: { type: Object, required: true }
});

const query = ref('');
const posts = ref([]);
const results = ref([]);
const page = ref(1);
const pageSize = 5;
let fuse = null;

function highlight(text) {
	if (!text) return '';
	const k = query.value.trim().replace(/ /g, '');
	if (!k) return text;
	const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${esc})`, 'gi');
	return text.replace(/ /g, '').replace(regex, '<mark>$1</mark>');
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
		out += chars[i];
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
		return;
	}
	try {
		let res = fuse.search(k);
		res = res.sort((a, b) => (b.score ?? 1) - (a.score ?? 1));
		results.value = res.map(r => ({ ...r.item, _score: r.score, _matches: r.matches || [] }));
	} catch (e) {
		results.value = [];
	}
}

// import data from '../assets/postlist.json';

onMounted(async () => {
	const data = await fetch('./postlist.json').then(res => res.json());
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
	if (props.props.keys) {
		nextTick(() => {
			query.value = decodeURIComponent(props.props.keys);
			runSearch(query.value);
		});
	}
});

function doSearch() {
	if (query.value.trim()) {
		const k = encodeURIComponent(query.value.trim());
		window.history.replaceState({}, '', `${window.location.pathname}?path=/search/${k}`);
		runSearch(query.value);
	}
}
</script>

<template>
	<main class="component">
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
			<a v-if="query" :href="`?path=/searchd/${encodeURIComponent(query)}`"
				class="text-sm href hover:underline">全文搜索</a>
		</div>
		<div v-if="results.length === 0">
			<p class="text-gray-600">没有找到匹配的文章。</p>
		</div>
		<div v-else>
			<div v-for="post in highlightedResults" :key="post.id" class="mt-4">
				<a :href="`?path=/post/${post.id}`" class="text-primary hover:underline" v-html="post.title"></a>
				<span class="text-gray-500">（{{ post.date }}）</span>
				<p class="text-gray-600 line-clamp-2" v-html="post.summary"></p>
			</div>
			<el-pagination class="mt-4" background size="small" :page-size="pageSize" :current-page="page"
				:total="total" :hide-on-single-page="true" @current-change="page = $event" />
		</div>
	</main>
</template>
```

| ${\Huge\color{red}\text{\textcircled{}}{\huge\hspace{-.71cm}\not}\footnotesize\overset{\small\hspace{-.1cm}\resetcolor{Fake}}{\color{transparent}.}}\newline\resetcolor{\footnotesize\text{Fake has been forbidden.}}$ |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
