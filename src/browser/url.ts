import { setURLParams } from '../url/index.js';

/**
 * 设置当前页面 URL 的查询参数（基于 `history.replaceState`），不会刷新页面。
 *
 * @param params - 要设置或覆盖的参数键值对
 * @param replace - 是否替换历史记录（true 使用 replaceState，false 使用 pushState），默认 true
 * @example
 * setCurrentURLParams({ a: '1', b: '2' })
 * // 当前 URL https://example.com/page?x=1 => https://example.com/page?x=1&a=1&b=2
 *
 * setCurrentURLParams({ a: '2' }, false)
 * // pushState，会新增一条历史记录
 */
export function setCurrentURLParams(
  params: Record<string, string | number>,
  replace = true,
): void {
  if (typeof window === 'undefined') return
  const newUrl = setURLParams(window.location.href, params)
  const method = replace ? 'replaceState' : 'pushState'
  window.history[method](null, '', newUrl)
}
