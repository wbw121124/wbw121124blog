<script>
export default {
	name: 'MyHeader',
	data() {
		return {
			menuItems: [
				{ name: '主页', link: '?path=/' },
				{ name: '关于', link: '?path=/about' },
				{ name: '联系', link: '?path=/contact' },
			],
		};
	},
};
</script>

<template>
	<header class="bg-white dark:bg-gray-800 shadow-sm mb-8 p-4" style="position: sticky; top: 0; z-index: 1;">
		<nav class="mx-auto">
			<ul class="flex space-x-4 flex-row items-center">
				<li style="list-style: none;">
					<a href="?path=/" class="hover:underline font-bold text-indigo-600"><img src="/logo.svg" alt="Logo"
							style="height: 1.25em;" /></a>
				</li>
				<li v-for="item in menuItems" :key="item.name" style="list-style: none;">
					<a :href="item.link" class="hover:underline">{{ item.name }}</a>
				</li>
			</ul>
		</nav>
	</header>
</template>