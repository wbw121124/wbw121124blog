<script setup>
import MyHeader from './components/MyHeader.vue';
import MyFooter from './components/MyFooter.vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

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

// 获取 ?path=... 查询参数
const urlParams = new URLSearchParams(window.location.search);
const path = urlParams.get('path') || '/';
const routeInfo = resolveRoute(path);

// 动态按需导入 routeInfo.component，并创建异步组件
import { defineAsyncComponent } from 'vue';
const MyComponent = defineAsyncComponent(() => import(`./components/${routeInfo.component}.vue`));


// 为不同页面预设最小高度，防止CLS布局偏移
const getMinHeightByRoute = (component) => {
	const heights = {
		'HomePage': '100vh',
		'AboutPage': '100vh',
		'ContactPage': '100vh',
		'PostPage': '100vh',
		'ArchivePage': '100vh',
		'TagsPage': '100vh',
		'TagPage': '100vh',
		'YearPage': '100vh',
		'SearchPage': '100vh',
		'SearchDPage': '100vh',
		'404': '100vh'
	};
	return heights[component] || '100vh';
};
</script>

<template>
	<el-config-provider :locale="zhCn">
		<MyHeader />
		<!-- 主内容区域 - 设置min-height防止footer布局偏移 -->
		<div class="mx-auto px-4 pb-8"
			:style="{ minHeight: 'calc(' + getMinHeightByRoute(routeInfo.component) + ' - var(--spacing) * 18 - 1.25em)' }">
			<!-- Suspense 用于处理异步组件加载 -->
			<Suspense>
				<!-- 实际内容 -->
				<template #default>
					<MyComponent :props="routeInfo.props" />
				</template>
				<!-- 加载中显示骨架屏 - 占用相同高度防止CLS -->
				<template #fallback>
					<div class="skeleton-container">
						<!-- 标题骨架 -->
						<!-- <el-skeleton :rows="1" animated /> -->
						<!-- 内容骨架 -->
						<!-- <el-skeleton :rows="3" animated style="margin-top: 16px;" /> -->
						<!-- <el-skeleton :rows="4" animated style="margin-top: 16px;" /> -->
						<!-- <el-skeleton :rows="5" animated style="margin-top: 16px;" /> -->
					</div>
				</template>
			</Suspense>
		</div>
		<MyFooter />
	</el-config-provider>
</template>


<style scoped>
.skeleton-container {
	padding: 24px 0;
}
</style>
