/** LCP（Largest Contentful Paint）最大内容绘制指标 */
export interface LCPMetric {
  /** LCP 时间（ms） */
  value: number
  /** 触发 LCP 的元素标签名 */
  element: string | undefined
  /** 触发 LCP 的资源 URL（如图片、视频） */
  url: string | undefined
}

interface LayoutShiftEntry extends PerformanceEntry {
  readonly value: number
  readonly hadRecentInput: boolean
}

/** CLS（Cumulative Layout Shift）累计布局偏移指标 */
export interface CLSMetric {
  /** CLS 分数 */
  value: number
}

/** FID（First Input Delay）首次输入延迟指标 */
export interface FIDMetric {
  /** 输入延迟时间（ms） */
  value: number
  /** 事件类型（如 pointerdown, click, keydown） */
  eventType: string
}

const SETTLE_TIMEOUT = 2000
const MAX_TIMEOUT = 15000

/**
 * 获取 LCP（Largest Contentful Paint）最大内容绘制时间。
 *
 * 基于 PerformanceObserver API 异步监听，在 LCP 稳定后（无新 LCP 条目超过 2s /
 * 页面隐藏 / 超时）返回最终值。
 *
 * @returns LCP 指标对象，PerformanceObserver 不可用时返回 null
 * @example
 * const lcp = await getLCP()
 * // => { value: 1234, element: 'IMG', url: 'https://example.com/hero.jpg' }
 */
export function getLCP(): Promise<LCPMetric | null> {
  if (typeof PerformanceObserver === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    let latestEntry: LargestContentfulPaint | null = null
    let settleTimer: ReturnType<typeof setTimeout>
    let cleanedUp = false

    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      clearTimeout(settleTimer)
      observer.disconnect()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && latestEntry) {
        cleanup()
        resolve(toLCPMetric(latestEntry))
      }
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      latestEntry = entries[entries.length - 1] as LargestContentfulPaint

      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        cleanup()
        resolve(toLCPMetric(latestEntry!))
      }, SETTLE_TIMEOUT)
    })

    observer.observe({ type: 'largest-contentful-paint', buffered: true })

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }

    setTimeout(() => {
      cleanup()
      resolve(latestEntry ? toLCPMetric(latestEntry) : null)
    }, MAX_TIMEOUT)
  })
}

function toLCPMetric(entry: LargestContentfulPaint): LCPMetric {
  return {
    value: entry.startTime,
    element: entry.element?.tagName,
    url: entry.url,
  }
}

/**
 * 获取 CLS（Cumulative Layout Shift）累计布局偏移值。
 *
 * 基于 PerformanceObserver API 异步监听，累加所有不含用户输入的布局偏移，
 * 在页面隐藏或超时时返回累计值。
 *
 * @returns CLS 指标对象，PerformanceObserver 不可用时返回 null
 * @example
 * const cls = await getCLS()
 * // => { value: 0.05 }
 */
export function getCLS(): Promise<CLSMetric | null> {
  if (typeof PerformanceObserver === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    let value = 0
    let cleanedUp = false

    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      observer.disconnect()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanup()
        resolve({ value })
      }
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as LayoutShiftEntry
        if (!shift.hadRecentInput) value += shift.value
      }
    })

    observer.observe({ type: 'layout-shift', buffered: true })

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }

    setTimeout(() => {
      cleanup()
      resolve({ value })
    }, MAX_TIMEOUT)
  })
}

/**
 * 获取 FID（First Input Delay）首次输入延迟。
 *
 * 基于 PerformanceObserver API 异步监听用户首次交互事件，
 * 计算事件触发到事件处理开始之间的延迟。
 *
 * @returns FID 指标对象，PerformanceObserver 不可用时返回 null
 * @example
 * const fid = await getFID()
 * // => { value: 12, eventType: 'pointerdown' }
 */
export function getFID(): Promise<FIDMetric | null> {
  if (typeof PerformanceObserver === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEventTiming
        observer.disconnect()
        resolve({
          value: e.processingStart - e.startTime,
          eventType: e.name,
        })
      }
    })

    observer.observe({ type: 'first-input', buffered: true })

    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, MAX_TIMEOUT)
  })
}
