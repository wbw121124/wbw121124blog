<script setup>
import MyHeader from './components/MyHeader.vue';
import MyFooter from './components/MyFooter.vue';

const MyRoutes = [
	{
		"path": "/",
		"component": "HomePage"
	},
	{
		"path": "/about",
		"component": "AboutPage"
	},
	{
		"path": "/contact",
		"component": "ContactPage"
	},
	{
		"path": "/post/:name",
		"component": "PostPage"
	},
	{
		"path": "/archive",
		"component": "ArchivePage"
	}
];

// route 解析函数
function resolveRoute(path) {
	for (const route of MyRoutes) {
		// 匹配路径，两个 : 之间为参数
		let path1 = route.path.split(':');
		let path2 = "", cnt = 0;
		// 生成正则表达式
		path1.forEach(segment => {
			cnt++;
			if (cnt == 2) {
				path2 += "([^/]+)";
				cnt = 0;
			}
			else// 防止正则表达式冲突
				path2 += segment.replace(/\//g, '\\/')
					.replace(/\./g, '\\.')
					.replace(/\*/g, '\\*')
					.replace(/\?/g, '\\?')
					.replace(/\+/g, '\\+')
					.replace(/\(/g, '\\(')
					.replace(/\)/g, '\\)')
					.replace(/\[/g, '\\[')
					.replace(/\]/g, '\\]')
					.replace(/\{/g, '\\{')
					.replace(/\}/g, '\\}');
		});
		const regex = new RegExp(`^${path2}$`);
		const match = path.match(regex);
		if (match) {
			// 提取参数
			const params = {};
			const paramNames = (route.path.match(/:([^/]+)/g) || []).map(name => name.substring(1));
			paramNames.forEach((name, index) => {
				params[name] = match[index + 1];
			});
			return {
				"component": route.component,
				"props": params,
				"path": path
			};
		}
	}
	return {
		"component": "404",
		"props": {},
		"path": path
	};
}

// 获取 ?path=... 查询参数
const urlParams = new URLSearchParams(window.location.search);
const path = urlParams.get('path') || '/';
const routeInfo = resolveRoute(path);

// 动态按需导入 routeInfo.component，并创建异步组件
import { defineAsyncComponent } from 'vue';
const MyComponent = defineAsyncComponent(() => import(`./components/${routeInfo.component}.vue`));
</script>

<template>
	<MyHeader />
	<div class="mx-auto px-4 pb-8">
		<MyComponent :props="routeInfo.props" />
	</div>
	<MyFooter />
</template>

<style scoped></style>
