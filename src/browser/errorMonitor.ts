/** JS 运行时错误信息 */
export interface JsErrorInfo {
  type: 'js'
  /** 错误消息 */
  message: string
  /** 错误发生的文件 URL */
  filename: string
  /** 行号 */
  lineno: number
  /** 列号 */
  colno: number
  /** 错误对象 */
  error: Error | null
  /** 捕获时间戳（ms） */
  timestamp: number
}

/** 未处理的 Promise 拒绝信息 */
export interface PromiseErrorInfo {
  type: 'unhandledrejection'
  /** rejection 原因值 */
  reason: unknown
  /** 捕获时间戳（ms） */
  timestamp: number
}

/** 资源加载失败信息 */
export interface ResourceErrorInfo {
  type: 'resource'
  /** 资源标签名（大写，如 SCRIPT / LINK / IMG） */
  tag: string
  /** 资源 URL */
  url: string
  /** 捕获时间戳（ms） */
  timestamp: number
}

/** 错误信息联合类型 */
export type ErrorInfo = JsErrorInfo | PromiseErrorInfo | ResourceErrorInfo

/** 错误监控配置选项 */
export interface ErrorMonitorOptions {
  /** 是否捕获 JS 运行时错误，默认 true */
  js?: boolean
  /** 是否捕获未处理的 Promise 拒绝，默认 true */
  promise?: boolean
  /** 是否捕获资源加载失败，默认 true */
  resource?: boolean
  /** 每次捕获到错误时的回调 */
  onError?: (error: ErrorInfo) => void
  /** 最多保存的错误数量，超出后丢弃最早错误，默认 100 */
  maxErrors?: number
}

/** 错误监控控制对象 */
export interface ErrorMonitor {
  /** 获取已捕获错误的只读列表 */
  getErrors(): readonly ErrorInfo[]
  /** 停止监听并清理事件监听器 */
  stop(): void
}

/** 需要监控的资源标签白名单 */
const RESOURCE_TAGS = ['SCRIPT', 'LINK', 'IMG', 'AUDIO', 'VIDEO', 'IFRAME', 'SOURCE'] as const

/**
 * 是否为资源加载错误事件。
 *
 * 通过 target.tagName 判断事件目标是否是已知资源标签。
 */
function isResourceEvent(event: Event): boolean {
  const target = event.target
  if (!target || !((target as HTMLElement).tagName)) return false
  const tag = (target as HTMLElement).tagName.toUpperCase()
  return (RESOURCE_TAGS as readonly string[]).includes(tag)
}

/**
 * 启动浏览器错误监控。
 *
 * 自动监听三类错误：
 * - JS 运行时错误（通过 window 的 error 事件捕获 ErrorEvent）
 * - 未处理的 Promise 拒绝（通过 window 的 unhandledrejection 事件）
 * - 资源加载失败（通过 window 的 error 事件捕获 script / link / img 等元素加载失败）
 *
 * 在 SSR 环境（window 不可用）下返回无操作对象，不会报错。
 *
 * @param options - 监控配置选项
 * @returns 包含 stop() 和 getErrors() 的控制对象
 * @example
 * const monitor = startErrorMonitor({
 *   onError: (err) => console.error('捕获到错误:', err),
 * })
 * // 停止监控
 * monitor.stop()
 * // 获取已收集的错误
 * monitor.getErrors()
 */
export function startErrorMonitor(options?: ErrorMonitorOptions): ErrorMonitor {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return { getErrors: () => [], stop: () => {} }
  }

  const { js = true, promise = true, resource = true, onError, maxErrors = 100 } = options ?? {}

  const errors: ErrorInfo[] = []

  function collect(info: ErrorInfo): void {
    errors.push(info)
    if (errors.length > maxErrors) {
      errors.shift()
    }
    onError?.(info)
  }

  const errorHandler = (event: Event): void => {
    // JS 运行时错误（ErrorEvent 含有 message 属性）
    if ('message' in event && typeof (event as Record<string, unknown>).message === 'string') {
      if (!js) return
      const evt = event as ErrorEvent
      collect({
        type: 'js',
        message: evt.message,
        filename: evt.filename,
        lineno: evt.lineno,
        colno: evt.colno,
        error: evt.error,
        timestamp: Date.now(),
      })
      return
    }

    // 资源加载失败
    if (!resource) return
    if (!isResourceEvent(event)) return

    const target = event.target as HTMLElement
    const tag = target.tagName.toUpperCase()
    let url = ''
    if (tag === 'LINK') {
      url = (target as HTMLLinkElement).href
    } else {
      url = (target as HTMLScriptElement | HTMLImageElement).src ?? ''
    }
    if (!url) return

    collect({
      type: 'resource',
      tag,
      url,
      timestamp: Date.now(),
    })
  }

  const rejectionHandler = (event: PromiseRejectionEvent): void => {
    if (!promise) return
    collect({
      type: 'unhandledrejection',
      reason: event.reason,
      timestamp: Date.now(),
    })
  }

  window.addEventListener('error', errorHandler)
  window.addEventListener('unhandledrejection', rejectionHandler)

  return {
    getErrors: () => [...errors],
    stop: () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    },
  }
}
