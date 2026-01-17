<template>
	<footer class="my-footer" role="contentinfo">
		<div class="border-t border-t-gray-100 py-4 px-6 flex justify-between items-center text-gray-600">
			<div class="left">
				<nav class="links" aria-label="footer links">
					<a href="?path=/">首页</a> <a href="?path=/about">关于</a> <a href="?path=/archive">归档</a> <a
						href="https://github.com/wbw121124" target="_blank" rel="noopener">GitHub</a>
				</nav>
			</div>
			<div class="right">
				<small>© {{ year }} wbw121124 · 版权所有</small>
			</div>
		</div>
	</footer>
</template>

<script setup>
import { computed } from 'vue'
const year = new Date().getFullYear()
</script>
