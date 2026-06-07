/**
 * 创建一个节流函数，在 `wait` 毫秒内最多执行一次 `fn`。
 *
 * 首次调用立即执行，随后在等待期间内的最后一次调用将在等待结束后执行。
 *
 * @param fn - 需要节流执行的函数
 * @param wait - 节流时间间隔（毫秒）
 * @returns 节流后的函数，附带 `cancel()` 方法
 * @example
 * const throttled = throttle((pos: number) => console.log(pos), 200)
 * throttled(1) // 立即输出 1
 * throttled(2) // 被节流，200ms 后输出 2
 * throttled.cancel() // 取消等待中的调用
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
): {
  (...args: Parameters<T>): ReturnType<T> | undefined
  cancel: () => void
} {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const throttled = (...args: Parameters<T>): ReturnType<T> | undefined => {
    if (!timer) {
      const result = fn(...args)
      timer = setTimeout(() => {
        timer = null
        if (lastArgs) {
          fn(...lastArgs)
          lastArgs = null
        }
      }, wait)
      return result
    }
    lastArgs = args
    return undefined
  }

  throttled.cancel = (): void => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
  }

  return throttled
}
