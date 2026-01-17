import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 异步加载markdown-it模块
let markdownItModule = null;
const loadMarkdownIt = async () => {
	if (!markdownItModule) {
		markdownItModule = await import('./mkd-it.js');
	}
	return markdownItModule;
};

// 导出异步加载函数
export { loadMarkdownIt };

// 初始化应用
const app = createApp(App);

// 后台预加载markdown-it（可选）
loadMarkdownIt().then(module => {
	console.log('Markdown-it module loaded');
});

app.mount('#app')
