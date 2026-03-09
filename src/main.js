import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Element Plus (UI 框架)
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

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

// 安装 Element Plus
app.use(ElementPlus);

// 注册所有 Element Plus 图标组件以便可以直接在模板中使用
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
Object.entries(ElementPlusIconsVue).forEach(([key, component]) => {
	app.component(key, component);
});

// 后台预加载markdown-it（可选）
loadMarkdownIt().then(module => {
	console.log('Markdown-it module loaded');
});

app.mount('#app')
