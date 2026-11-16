<script>
import { withBase } from '../lib/withBase.js';

export default {
	name: 'MyHeader',
	data() {
		return {
			menuItems: [
				{ name: '主页', link: '/' },
				{ name: '归档', link: '/archive/' },
				{ name: '标签', link: '/tags/' },
				{ name: '关于', link: '/about/' },
				{ name: '联系', link: '/contact/' },
			],
			searchQuery: ''
		};
	},
	methods: {
		withBase,
		doSearch() {
			const q = this.searchQuery.trim();
			if (q) {
				window.location.href = withBase('/search/?q=' + encodeURIComponent(q));
			}
		}
	}
};
</script>

<template>
	<header class="shadow-sm mb-8 p-4" style="position: sticky; top: 0; z-index: 1001;">
		<nav class="mx-auto">
			<ul class="flex space-x-4 flex-row items-center">
				<li
					style="list-style: none; display: inline-flex; align-content: center; flex-wrap: wrap; justify-content: center; align-items: center;">
					<a :href="withBase('/')" class="font-bold"><img src="/logo.svg" alt="Logo"
							style="height: 1.25em; width: 2.5em;" /></a>
				</li>
				<li v-for="item in menuItems" :key="item.name" style="list-style: none;">
					<a :href="withBase(item.link)" class="hover:underline">{{ item.name }}</a>
				</li>
				<li style="list-style: none; margin-left:auto;">
					<el-input v-model="searchQuery" placeholder="搜索文章" size="default" class="w-40"
						@keyup.enter.native="doSearch">
						<template #append>
							<el-button size="default" @click="doSearch" aria-label="搜索">
								<el-icon>
									<i-ep-search />
								</el-icon>
							</el-button>
						</template>
					</el-input>
				</li>
			</ul>
		</nav>
	</header>
</template>