/**
 * 设置 URL 查询参数并返回新的 URL。
 *
 * @param url - 完整的 URL 或 query string（如 `?a=1`）
 * @param params - 要设置或覆盖的参数键值对，值为 `string | number`
 * @returns 修改后的 URL
 * @example
 * setURLParams('https://example.com/page?a=1', { b: '2' }) // => 'https://example.com/page?a=1&b=2'
 * setURLParams('https://example.com/page?a=1', { a: '2' }) // => 'https://example.com/page?a=2'
 * setURLParams('https://example.com/page', { a: '1' })     // => 'https://example.com/page?a=1'
 * setURLParams('?a=1', { b: '2' })                         // => '?a=1&b=2'
 */
export function setURLParams(url: string, params: Record<string, string | number>): string {
  const hashIdx = url.indexOf('#');
  const hash = hashIdx !== -1 ? url.slice(hashIdx) : '';
  const urlWithoutHash = hashIdx !== -1 ? url.slice(0, hashIdx) : url;

  const idx = urlWithoutHash.indexOf('?');
  const base = idx === -1 ? urlWithoutHash : urlWithoutHash.slice(0, idx);
  const searchParams = new URLSearchParams(idx === -1 ? '' : urlWithoutHash.slice(idx));

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  const searchStr = searchParams.toString();
  return searchStr ? `${base}?${searchStr}${hash}` : `${base}${hash}`;
}

/**
 * 解析 URL 中的所有查询参数并返回键值对对象。
 *
 * @param url - 待解析的完整 URL 或 query string（如 `?a=1&b=2`）
 * @returns 参数键值对对象，无参数时返回空对象
 * @example
 * getURLParamsAll('?name=jack&age=18')  // => { name: 'jack', age: '18' }
 * getURLParamsAll('https://example.com/page?a=1')  // => { a: '1' }
 * getURLParamsAll('https://example.com/page')  // => {}
 */
export function getURLParamsAll(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const idx = url.indexOf('?');
    if (idx === -1) return params;
    const qs = url.slice(idx);
    const hashIdx = qs.indexOf('#');
    const searchParams = new URLSearchParams(hashIdx === -1 ? qs : qs.slice(0, hashIdx));
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch {
    // URL 非法时返回空对象
  }
  return params;
}
