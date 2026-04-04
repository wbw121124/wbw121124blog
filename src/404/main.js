import { createApp } from 'vue'
import '../style.css'
import App from './App.vue'

// Element Plus (UI 框架)
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'

// 初始化应用
const app = createApp(App);

// 安装 Element Plus
app.use(ElementPlus, {
	locale: zhCn,
});

// 注册所有 Element Plus 图标组件以便可以直接在模板中使用
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
Object.entries(ElementPlusIconsVue).forEach(([key, component]) => {
	app.component(key, component);
});

app.mount('#app')
