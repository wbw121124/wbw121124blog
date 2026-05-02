<script setup>
import { defineAsyncComponent } from 'vue';
const PostList = defineAsyncComponent(() => import('./PostList.vue'));
</script>

<template>
	<main class="component XiaolaiMono">
		<h2 class="text-2xl font-bold mb-6 LXGWNeoXiHeiPlus">欢迎来到 wbw121124blog</h2>
		<!--计数器 ID:wp9umuzk 控制面板访问密钥:gap0vog1
		<img src="https://w.saobby.com/w/wp9umuzk" height="0" width="0"
			style="position: fixed; z-index: -2147483648; opacity: 0;" alt="网站访问统计" />-->
		<p class="text-gray-600 dark:text-gray-400 mb-4">这是一个基于 Vue 3 和 Vite 构建的博客网站。</p>
		<div class="mkd acsii-art"
			style="align-items: center; justify-content: center; display: flex; margin-top: 2rem;">
			<pre class="text-primary font-bold" style="line-height: 1.25 !important;"><code style="line-height: 1.25 !important; width: max-content;">           _               _  ____   _  _  ____   _  _    _      _               
__      __| |__ __      __/ ||___ \ / |/ ||___ \ | || |  | |__  | |  ___    __ _ 
\ \ /\ / /| '_ \\ \ /\ / /| |  __) || || |  __) || || |_ | '_ \ | | / _ \  / _` |
 \ V  V / | |_) |\ V  V / | | / __/ | || | / __/ |__   _|| |_) || || (_) || (_| |
  \_/\_/  |_.__/  \_/\_/  |_||_____||_||_||_____|   |_|  |_.__/ |_| \___/  \__, |
                                                                           |___/ </code></pre>
		</div>
	</main>

	<PostList />
</template>