// 统一网络请求封装：fetch + res.ok 校验 + JSON 解析 + 指数退避重试 + 超时控制
// 纯数据层，不做任何 UI 提示；只负责返回解析后的 JSON 或把最后一个 Error 向上抛。

/**
 * 统一 fetch JSON 请求
 * @param {string} url - 已 withBase 处理过的站内 URL
 * @param {Object} opts - 可选配置
 * @param {number} opts.timeout - 超时时间（ms），默认 8000
 * @param {number} opts.retries - 重试次数，默认 3
 * @param {number} opts.retryDelay - 重试基础延迟（ms），默认 500，按指数退避
 * @returns {Promise<any>} 解析后的 JSON 数据
 */
export default async function fetchJson(url, opts = {}) {
	const timeout = opts.timeout ?? 8000;
	const retries = opts.retries ?? 3;
	const retryDelay = opts.retryDelay ?? 500;

	let lastErr = null;

	for (let i = 0; i <= retries; i++) {
		const controller = new AbortController();

		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => {
				controller.abort();
				reject(new Error(`fetch 请求超时：${url}（${timeout}ms）`));
			}, timeout);
		});

		try {
			const res = await Promise.race([
				fetch(url, {
					signal: controller.signal
				}).catch(err => {
					// 仅忽略由超时触发的 AbortError，真正的网络错误继续抛出
					if (err.name === 'AbortError') return undefined;
					throw err;
				}),
				timeoutPromise
			]);

			if (!res.ok) {
				// HTTP 错误状态码，直接抛出，不重试
				const httpErr = new Error(`HTTP ${res.status} ${res.statusText}`);
				httpErr.isHttpError = true;
				throw httpErr;
			}

			return await res.json();
		} catch (err) {
			// HTTP 错误不重试，直接向上抛
			if (err.isHttpError) throw err;

			lastErr = err;
			if (i < retries) {
				// 指数退避：retryDelay * 2^i
				await new Promise(resolve => setTimeout(resolve, retryDelay * (1 << i)));
				continue;
			}
			throw lastErr;
		}
	}

	throw lastErr;
}
