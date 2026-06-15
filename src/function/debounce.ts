/**
 * 创建一个防抖函数，在最后一次调用后等待 `delay` 毫秒再执行 `fn`。
 *
 * @param fn - 需要防抖执行的函数
 * @param delay - 防抖延迟时间（毫秒）
 * @param options - 可选配置
 * @param options.leading - 是否在延迟开始前立即执行一次（默认 `false`）
 * @returns 防抖后的函数，附带 `cancel()` 和 `flush()` 方法
 * @example
 * const debounced = debounce((msg: string) => console.log(msg), 200)
 * debounced('hello') // 200ms 后输出 'hello'
 * debounced.cancel() // 取消本次调度
 *
 * const leading = debounce(() => save(), 300, { leading: true })
 * leading() // 立即执行 save
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options?: { leading?: boolean },
): {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
} {
  const leading = options?.leading ?? false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>): ReturnType<T> | undefined => {
    const callNow = leading && !timer;
    lastArgs = args;

    if (timer) clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null;
      if (!leading && lastArgs) {
        fn(...lastArgs);
      }
      lastArgs = null;
    }, delay);

    if (callNow) {
      return fn(...args);
    }
    return undefined;
  }

  debounced.cancel = (): void => {
    if (timer) clearTimeout(timer)
    timer = null;
    lastArgs = null;
  }

  debounced.flush = (): ReturnType<T> | undefined => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (lastArgs) {
      const result = fn(...lastArgs);
      lastArgs = null;
      return result;
    }
    return undefined;
  }

  return debounced;
}
