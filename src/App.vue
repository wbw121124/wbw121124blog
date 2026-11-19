<script setup>
import MyHeader from './components/MyHeader.vue';
import MyFooter from './components/MyFooter.vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { withBase } from './lib/withBase.js';

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
	},
	{
		"path": "/tags",
		"component": "TagsPage"
	},
	{
		"path": "/tag/:name",
		"component": "TagPage"
	},
	{
		"path": "/posts/:year",
		"component": "YearPage"
	},
	{
		"path": "/search/:keys",
		"component": "SearchPage"
	},
	{
		"path": "/searchd/:keys",
		"component": "SearchDPage"
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

// 路由真源三级回退：
// 1) ?path= 查询参数（旧链接兼容，显式优先）
// 2) 静态生成页注入的 data-route 属性（构建期 buildPages.js 写入）
// 3) 解析 location.pathname（vite dev 与 GH Pages 直链场景）
function getRouteInfo() {
	const pathParam = new URLSearchParams(window.location.search).get('path');
	if (pathParam) return resolveRoute(pathParam);

	const injected = document.documentElement.dataset.route;
	if (injected) {
		try {
			return JSON.parse(injected);
		} catch {
			// data-route 解析失败时落到 pathname 解析
		}
	}

	let path = window.location.pathname;
	// 剥离部署 base（GH 变体在 /wbw121124blog/ 下）
	const deployBase = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
	if (deployBase && path.startsWith(deployBase)) path = path.slice(deployBase.length) || '/';
	// 归一化：保证以 / 开头、去尾部斜杠（路由表按无尾斜杠匹配）
	if (!path.startsWith('/')) path = '/' + path;
	if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
	return resolveRoute(path);
}
const routeInfo = getRouteInfo();

// 动态按需导入 routeInfo.component，并创建异步组件
import { defineAsyncComponent } from 'vue';
const MyComponent = defineAsyncComponent(() => import(`./components/${routeInfo.component}.vue`));
</script>

<template>
	<el-config-provider :locale="zhCn">
		<MyHeader />
		<!-- 主内容区域 - 设置min-height防止footer布局偏移 -->
		<div class="mx-auto px-4 pb-8"
			style="min-height: calc(100vh - var(--spacing) * 18 - 1.25em); max-width: 1200px;">
			<MyComponent :props="routeInfo.props" />
		</div>
		<MyFooter />
	</el-config-provider>
</template>
