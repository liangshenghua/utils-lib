/**
 * 移除对象中值为 `null`、`undefined` 或空字符串的属性，返回一个新对象。
 *
 * @param obj - 待处理的对象
 * @returns 移除空值后的新对象
 * @example
 * omitBlank({ a: 1, b: null, c: undefined, d: '', e: 0 }) // => { a: 1, e: 0 }
 * omitBlank({}) // => {}
 * omitBlank(null as Record<string, any> | null) // => {}
 */
export function omitBlank<T extends Record<string, any>>(obj: T): { [K in keyof T as T[K] extends null | undefined | '' ? never : K]: T[K] } {
  const result = {} as any;
  if (!obj) return result;
  for (const key of Object.keys(obj)) {
    if (obj[key] != null && obj[key] !== '') {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 移除对象中值为 `null` 或 `undefined` 的属性，返回一个新对象。
 *
 * @param obj - 待处理的对象
 * @returns 移除空值后的新对象
 * @example
 * omitNil({ a: 1, b: null, c: undefined, d: 'hello' }) // => { a: 1, d: 'hello' }
 * omitNil({}) // => {}
 * omitNil(null as Record<string, any> | null) // => {}
 */
export function omitNil<T extends Record<string, any>>(obj: T): { [K in keyof T as T[K] extends null | undefined ? never : K]: T[K] } {
  const result = {} as any;
  if (!obj) return result;
  for (const key of Object.keys(obj)) {
    if (obj[key] != null) {
      result[key] = obj[key];
    }
  }
  return result;
}
