import mediumZoom from 'medium-zoom/dist/pure'
window.mediumZoom=mediumZoom;
document.addEventListener('DOMContentLoaded',()=>{
	mediumZoom('.component :not(a)>img');
})
import { createApp } from 'vue'
import App from './App.vue'
import 'medium-zoom/dist/style.css'
import './style.css'

// 初始化应用
const app = createApp(App);

// 注册所有 Element Plus 图标组件以便可以直接在模板中使用
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
Object.entries(ElementPlusIconsVue).forEach(([key, component]) => {
	app.component(key, component);
});

app.mount('#app')

setTimeout(()=>{mediumZoom('.component :not(a)>img')},1000);
