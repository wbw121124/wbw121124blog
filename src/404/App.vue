<script setup>
import MyHeader from '../components/MyHeader.vue';
import MyFooter from '../components/MyFooter.vue';
import MyComponent from '../components/404.vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

// 获取 ?path=... 查询参数
const urlParams = new URLSearchParams(window.location.search);
const path = urlParams.get('path') || '/';
const routeInfo = {
	"component": "404",
	"props": {},
	"path": path
};
</script>

<template>
	<el-config-provider :locale="zhCn">
		<MyHeader />
		<div class="mx-auto px-4 pb-8">
			<MyComponent :props="routeInfo.props" />
		</div>
		<MyFooter />
	</el-config-provider>
</template>
