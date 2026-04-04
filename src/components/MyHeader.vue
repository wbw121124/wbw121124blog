<script>
export default {
	name: 'MyHeader',
	data() {
		return {
			menuItems: [
				{ name: '主页', link: '?path=/' },
				{ name: '归档', link: '?path=/archive' },
				{ name: '标签', link: '?path=/tags' },
				{ name: '关于', link: '?path=/about' },
				{ name: '联系', link: '?path=/contact' },
			],
			searchQuery: ''
		};
	},
	methods: {
		doSearch() {
			const q = this.searchQuery.trim();
			if (q) {
				window.location.href = `?path=/search/${encodeURIComponent(q)}`;
			}
		}
	}
};
</script>

<template>
	<header class="shadow-sm mb-8 p-4" style="position: sticky; top: 0; z-index: 1;">
		<nav class="mx-auto">
			<ul class="flex space-x-4 flex-row items-center">
				<li style="list-style: none;">
					<a href="?path=/" class="hover:underline font-bold href"><img src="/logo.svg" alt="Logo"
							style="height: 1.25em;" /></a>
				</li>
				<li v-for="item in menuItems" :key="item.name" style="list-style: none;">
					<a :href="item.link" class="hover:underline">{{ item.name }}</a>
				</li>
				<li style="list-style: none; margin-left:auto;">
					<el-input v-model="searchQuery" placeholder="搜索文章" size="default" class="w-40"
						@keyup.enter.native="doSearch">
						<template #append>
							<el-button size="default" @click="doSearch" aria-label="搜索">
								<el-icon>
									<Search />
								</el-icon>
							</el-button>
						</template>
					</el-input>
				</li>
			</ul>
		</nav>
	</header>
</template>