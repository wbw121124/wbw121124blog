<script setup>
import MyHeader from '../components/MyHeader.vue';
import MyFooter from '../components/MyFooter.vue';

// 获取 ?path=... 查询参数
const urlParams = new URLSearchParams(window.location.search);
const path = urlParams.get('path') || '/';
const routeInfo = {
	"component": "404",
	"props": {},
	"path": path
};

// 动态按需导入 routeInfo.component，并创建异步组件
import { defineAsyncComponent } from 'vue';
const MyComponent = defineAsyncComponent(() => import(`../components/${routeInfo.component}.vue`));
</script>

<template>
	<MyHeader />
	<div class="mx-auto px-4 pb-8">
		<MyComponent :props="routeInfo.props" />
	</div>
	<MyFooter />
</template>

<style scoped></style>
