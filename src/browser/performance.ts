/** 导航计时信息 */
export interface NavigationTiming {
  /** DNS 查询耗时（ms） */
  dns: number
  /** TCP 连接耗时（ms） */
  tcp: number
  /** TLS 握手耗时（ms） */
  tls: number
  /** 首字节时间 TTFB（ms） */
  ttfb: number
  /** DOM 解析耗时（ms，responseEnd → domInteractive） */
  domParse: number
  /** DOMContentLoaded 事件耗时（ms） */
  domContentLoaded: number
  /** 页面渲染耗时（ms，DCL 结束 → Load 结束） */
  render: number
  /** 页面完全加载总耗时（ms） */
  total: number
  /** 重定向耗时（ms） */
  redirect: number
  /** 页面加载类型 */
  type: 'navigate' | 'reload' | 'back_forward' | 'prerender'
}

/** 渲染计时信息 */
export interface PaintTiming {
  /** First Paint 首次绘制时间（ms） */
  fp: number
  /** First Contentful Paint 首次内容绘制时间（ms） */
  fcp: number
}

/** 资源加载统计 */
export interface ResourceTimingSummary {
  /** 资源 URL */
  name: string
  /** 资源类型（如 script, link, img, fetch） */
  type: string
  /** 总耗时（ms） */
  duration: number
  /** 传输大小（byte） */
  transferSize: number
  /** DNS 查询耗时（ms） */
  dns: number
  /** TTFB（ms） */
  ttfb: number
}

/**
 * 检查浏览器 Performance API 是否可用。
 *
 * @returns Performance API 可用时返回 true，否则返回 false
 * @example
 * hasPerformance()  // => true
 */
function hasPerformance(): boolean {
  return typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
}


/**
 * 获取页面导航性能数据。
 *
 * 基于 PerformanceNavigationTiming API，可分析 DNS / TCP / TLS / TTFB /
 * DOM 解析 / 首屏渲染等各阶段耗时。
 *
 * @returns 导航计时信息，Performance API 不可用时返回 null
 * @example
 * getNavigationTiming()
 * // => { dns: 10, tcp: 15, tls: 20, ttfb: 100, domParse: 50, ... }
 */
export function getNavigationTiming(): NavigationTiming | null {
  if (!hasPerformance()) return null

  const entries = performance.getEntriesByType('navigation')
  if (entries.length === 0) return null

  const nav = entries[0] as PerformanceNavigationTiming

  return {
    dns: Math.max(nav.domainLookupEnd - nav.domainLookupStart, 0),
    tcp: Math.max(nav.connectEnd - nav.connectStart, 0),
    tls:
      nav.secureConnectionStart > 0
        ? Math.max(nav.connectEnd - nav.secureConnectionStart, 0)
        : 0,
    ttfb: Math.max(nav.responseStart - nav.requestStart, 0),
    domParse: Math.max(nav.domInteractive - nav.responseEnd, 0),
    domContentLoaded: Math.max(
      nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
      0,
    ),
    render: Math.max(nav.loadEventEnd - nav.domContentLoadedEventEnd, 0),
    total: Math.max(nav.loadEventEnd - nav.startTime, 0),
    redirect: Math.max(nav.redirectEnd - nav.redirectStart, 0),
    type: nav.type as NavigationTiming['type'],
  }
}

/**
 * 获取页面渲染性能数据（FP / FCP）。
 *
 * 基于 Paint Timing API：
 * - FP（First Paint）：浏览器首次将任何像素绘制到屏幕
 * - FCP（First Contentful Paint）：浏览器首次绘制任何文本 / 图片 / SVG
 *
 * @returns 渲染计时信息，Paint API 不可用时返回 null
 * @example
 * getPaintTiming()
 * // => { fp: 120, fcp: 250 }
 */
export function getPaintTiming(): PaintTiming | null {
  if (!hasPerformance()) return null

  const entries = performance.getEntriesByType('paint')
  if (entries.length === 0) return null

  const fp = entries.find(e => e.name === 'first-paint')?.startTime ?? 0
  const fcp = entries.find(e => e.name === 'first-contentful-paint')?.startTime ?? 0

  return { fp, fcp }
}

// ---------------------------------------------------------------------------
// 资源计时
// ---------------------------------------------------------------------------

/**
 * 获取页面资源加载性能数据。
 *
 * @param filter - 可选资源 URL 过滤函数
 * @returns 资源计时信息列表
 * @example
 * getResourceTiming(url => url.includes('.js'))
 * // => [{ name: 'https://example.com/app.js', duration: 300, transferSize: 50000, ... }]
 */
export function getResourceTiming(filter?: (url: string) => boolean): ResourceTimingSummary[] {
  if (!hasPerformance()) return []

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

  return entries
    .filter(entry => !filter || filter(entry.name))
    .map(entry => ({
      name: entry.name,
      type: entry.initiatorType,
      duration: Math.max(entry.duration, 0),
      transferSize: entry.transferSize,
      dns: Math.max(entry.domainLookupEnd - entry.domainLookupStart, 0),
      ttfb: Math.max(entry.responseStart - entry.requestStart, 0),
    }))
}