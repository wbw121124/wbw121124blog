<template>
	<footer class="my-footer" role="contentinfo">
		<div class="border-t border-t-gray-100 py-4 px-6 flex justify-between items-center text-gray-600 dark:text-gray-400">
			<div class="left">
				<nav class="links" aria-label="footer links">
					<a href="?path=/">首页</a>
					<a href="?path=/archive">归档</a>
					<a href="?path=/tags">标签</a>
					<a href="?path=/about">关于</a>
					<a href="https://github.com/wbw121124" target="_blank" rel="noopener">GitHub</a>
				</nav>
			</div>
			<div class="right">
				<small>© {{ year }} wbw121124 · 版权所有</small>
			</div>
		</div>
	</footer>
	<canvas id="universe" style="
	    position: fixed;
	    pointer-events: none;
	    z-index: -1;
		top: 0;" />
</template>

<script setup>
const year = new Date().getFullYear();

onMounted(() => {
	/*
	以下代码基于以下 ISC 许可代码修改而来：
	原始来源：https://npm.elemecdn.com/anzhiyu-theme-static@1.0.0/dark/dark.js
	原始许可证：ISC License
	修改内容：已进行修改以适应本项目的需要。
	*/
	function initUniverse() {
		window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
		
		const canvas = document.getElementById("universe");
		if (!canvas) return;
		
		let n, e, i, h;
		const t = 0.05;
		let o = true;
		const a = "180,184,240";
		const r = "226,225,142";
		const d = "226,225,224";
		const c = [];
		
		function f() {
			n = window.innerWidth;
			e = window.innerHeight;
			i = 0.1919810 * n;
			canvas.setAttribute("width", n);
			canvas.setAttribute("height", e);
		}
		
		function u() {
			if (!h) return;
			h.clearRect(0, 0, n, e);
			for (let idx = 0; idx < c.length; idx++) {
				const star = c[idx];
				star.move();
				star.fadeIn();
				star.fadeOut();
				star.draw();
			}
		}
		
		function y() {
			this.reset = function () {
				this.giant = m(3);
				this.comet = !this.giant && !o && m(10);
				this.x = l(0, n - 10);
				this.y = l(0, e);
				this.r = l(1.1, 2.6);
				this.dx = l(t, 6 * t) + (this.comet ? t * l(50, 120) : 0) + 2 * t;
				this.dy = -l(t, 6 * t) - (this.comet ? t * l(50, 120) : 0);
				this.fadingOut = null;
				this.fadingIn = true;
				this.opacity = 0;
				this.opacityTresh = l(0.2, 1 - 0.4 * (this.comet ? 1 : 0));
				this.do = l(5e-4, 0.002) + 0.001 * (this.comet ? 1 : 0);
			};
			
			this.fadeIn = function () {
				if (this.fadingIn) {
					if (this.opacity > this.opacityTresh) this.fadingIn = false;
					this.opacity += this.do;
				}
			};
			
			this.fadeOut = function () {
				if (this.fadingOut) {
					if (this.opacity < 0) this.fadingOut = false;
					this.opacity -= this.do / 2;
					if ((this.x > n || this.y < 0)) {
						this.fadingOut = false;
						this.reset();
					}
				}
			};
			
			this.draw = function () {
				if (!h) return;
				h.beginPath();
				if (this.giant) {
					h.fillStyle = "rgba(" + a + "," + this.opacity + ")";
					h.arc(this.x, this.y, 2, 0, 2 * Math.PI, false);
				} else if (this.comet) {
					h.fillStyle = "rgba(" + d + "," + this.opacity + ")";
					h.arc(this.x, this.y, 1.5, 0, 2 * Math.PI, false);
					for (let t2 = 0; t2 < 30; t2++) {
						h.fillStyle = "rgba(" + d + "," + (this.opacity - this.opacity / 20 * t2) + ")";
						h.rect(this.x - this.dx / 4 * t2, this.y - this.dy / 4 * t2 - 2, 2, 2);
						h.fill();
					}
				} else {
					h.fillStyle = "rgba(" + r + "," + this.opacity + ")";
					h.rect(this.x, this.y, this.r, this.r);
				}
				h.closePath();
				h.fill();
			};
			
			this.move = function () {
				this.x += this.dx;
				this.y += this.dy;
				if (this.fadingOut === false) this.reset();
				if ((this.x > n - n / 4 || this.y < 0)) this.fadingOut = true;
			};
			
			setTimeout(function () {
				o = false;
			}, 50);
		}
		
		function m(threshold) {
			return Math.floor(1000 * Math.random()) + 1 < 10 * threshold;
		}
		
		function l(min, max) {
			return Math.random() * (max - min) + min;
		}
		
		f();
		window.addEventListener("resize", f, false);
		
		h = canvas.getContext("2d");
		for (let idx = 0; idx < i; idx++) {
			c[idx] = new y();
			c[idx].reset();
		}
		u();
		
		function animate() {
			u();
			window.requestAnimationFrame(animate);
		}
		animate();
	}

	window.initUniverse = initUniverse;
	
	initUniverse();
});
</script>
