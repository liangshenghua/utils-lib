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

/**
 * 从对象中选取指定属性，返回新对象。
 *
 * @param obj - 源对象
 * @param keys - 要选取的属性名列表
 * @returns 只包含指定属性的新对象
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // => { a: 1, c: 3 }
 * pick({ a: 1, b: 2 }, []) // => {}
 * pick(null as Record<string, any> | null, ['a']) // => {}
 */
export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  if (!obj) return result;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 从对象中排除指定属性，返回新对象。
 *
 * @param obj - 源对象
 * @param keys - 要排除的属性名列表
 * @returns 排除指定属性后的新对象
 * @example
 * omit({ a: 1, b: 2, c: 3 }, ['a', 'c']) // => { b: 2 }
 * omit({ a: 1, b: 2 }, []) // => { a: 1, b: 2 }
 * omit(null as Record<string, any> | null, ['a']) // => {}
 */
export function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = {} as Omit<T, K>;
  if (!obj) return result;
  const keySet = new Set<K>(keys);
  for (const key of Object.keys(obj)) {
    if (!keySet.has(key as K)) {
      (result as any)[key] = obj[key];
    }
  }
  return result;
}
