import mediumZoom from 'medium-zoom/dist/pure'
window.mediumZoom = mediumZoom;
document.addEventListener('DOMContentLoaded', () => {
	mediumZoom('.component :not(a)>img:not(.medium-zoom-image)');
})
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// 初始化应用
const app = createApp(App);

app.mount('#app')

setTimeout(() => { mediumZoom('.component :not(a)>img:not(.medium-zoom-image)') }, 1000);

function smoothScrollToElement(element, duration = 500) {
	const startPosition = window.scrollY;

	// 获取 scroll-margin-top
	const computedStyle = window.getComputedStyle(element);
	const scrollMarginTop = parseFloat(computedStyle.scrollMarginTop) || 0;

	// 计算目标位置（减去 scroll-margin-top）
	const targetPosition = element.getBoundingClientRect().top + window.scrollY - scrollMarginTop;
	const distance = targetPosition - startPosition;

	let startTime = null;

	function animation(currentTime) {
		if (startTime === null) startTime = currentTime;
		const timeElapsed = currentTime - startTime;
		const progress = Math.min(timeElapsed / duration, 1);

		// easeInOutQuad 缓动
		const ease = progress < 0.5
			? 2 * progress * progress
			: 1 - Math.pow(-2 * progress + 2, 2) / 2;

		window.scrollTo(0, startPosition + distance * ease);

		if (timeElapsed < duration) {
			requestAnimationFrame(animation);
		}
	}

	requestAnimationFrame(animation);
}

window.smoothScrollToElement = smoothScrollToElement;