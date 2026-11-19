import mediumZoom from 'medium-zoom/dist/pure'
import { createApp } from 'vue'
import App from './App.vue'

window.mediumZoom = mediumZoom;

// 初始化应用
const app = createApp(App);

app.mount('#app')

// medium-zoom 绑定：不再用定时器赌渲染完成，改为监听 DOM 变更后统一收集，
// 慢网络下晚到的图片也能被绑定上
const zoomSelector = '.component :not(a)>img:not(.medium-zoom-image)';
const observedImgs = new WeakSet();
let zoomPending = false;
const zoomObserver = new MutationObserver(() => {
	// 到下一个微任务再收集，避免同一批 DOM 变更触发多次
	if (zoomPending) return;
	zoomPending = true;
	Promise.resolve().then(() => {
		zoomPending = false;
		const imgs = Array.from(document.querySelectorAll(zoomSelector))
			.filter(img => !observedImgs.has(img));
		if (imgs.length) {
			imgs.forEach(img => observedImgs.add(img));
			mediumZoom(imgs);
		}
	});
});
zoomObserver.observe(document.body, { childList: true, subtree: true });
// MPA 下本模块随页面生命周期存在，页面销毁时 observer 一并销毁，无需 disconnect

// 当前滚动动画的 rAF 句柄与打断监听引用（供连续调用时打断旧动画、移除旧监听）
let scrollAnimRafId = null;
let scrollAnimCancel = null;

// 平滑滚动到目标元素
function smoothScrollToElement(element, duration = 500) {
	const startPosition = window.scrollY;

	// 获取 scroll-margin-top
	const computedStyle = window.getComputedStyle(element);
	const scrollMarginTop = parseFloat(computedStyle.scrollMarginTop) || 0;

	// 计算目标位置（减去 scroll-margin-top）
	const targetPosition = element.getBoundingClientRect().top + window.scrollY - scrollMarginTop;
	const distance = targetPosition - startPosition;

	let startTime = null;

	// 上一次动画还没结束时先取消，避免新旧动画叠加打架
	if (scrollAnimRafId) cancelAnimationFrame(scrollAnimRafId);
	scrollAnimRafId = null;
	if (scrollAnimCancel) {
		// 移除上一次动画遗留的打断监听
		window.removeEventListener('wheel', scrollAnimCancel);
		window.removeEventListener('touchstart', scrollAnimCancel);
		scrollAnimCancel = null;
	}

	// 用户按下滚轮/触摸屏时终止当前动画（具名函数：取消 rAF 并移除两个打断监听）
	function cancelScrollAnim() {
		if (scrollAnimRafId) cancelAnimationFrame(scrollAnimRafId);
		scrollAnimRafId = null;
		// once 已触发的那条移除是防御性 no-op，另一条必须主动移除，避免遗留监听误杀下一次动画
		window.removeEventListener('wheel', cancelScrollAnim);
		window.removeEventListener('touchstart', cancelScrollAnim);
	}

	// 动画启动时注册一次性打断监听，用具名函数引用以便成对移除
	scrollAnimCancel = cancelScrollAnim;
	window.addEventListener('wheel', cancelScrollAnim, { passive: true, once: true });
	window.addEventListener('touchstart', cancelScrollAnim, { passive: true, once: true });

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
			// 继续下一帧
			scrollAnimRafId = requestAnimationFrame(animation);
		} else {
			// 动画自然结束：同样走 cancelScrollAnim 统一清理（once 已触发者 remove 无副作用）
			cancelScrollAnim();
			scrollAnimCancel = null;
		}
	}

	scrollAnimRafId = requestAnimationFrame(animation);
}

window.smoothScrollToElement = smoothScrollToElement;