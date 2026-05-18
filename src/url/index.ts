/**
 * 解析 URL 中的所有查询参数并返回键值对对象。
 *
 * @param url - 待解析的完整 URL 或 query string（如 `?a=1&b=2`）
 * @returns 参数键值对对象，无参数时返回空对象
 * @example
 * getURLParamsAll('?name=jack&age=18')  // => { name: 'jack', age: '18' }
 * getURLParamsAll('https://example.com/page?a=1')  // => { a: '1' }
 * getURLParamsAll('https://example.com')  // => {}
 */
export function getURLParamsAll(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  try {
    const idx = url.indexOf('?')
    if (idx === -1) return params
    const searchParams = new URLSearchParams(url.slice(idx))
    searchParams.forEach((value, key) => {
      params[key] = value
    })
  } catch {
    // URL 非法时返回空对象
  }
  return params
}