export type {
  JsErrorInfo,
  PromiseErrorInfo,
  ResourceErrorInfo,
  ErrorInfo,
  ErrorMonitorOptions,
  ErrorMonitor,
} from './errorMonitorTypes.js';

import type {
  ErrorInfo,
  ErrorMonitor,
  ErrorMonitorOptions,
} from './errorMonitorTypes.js';

/** 需要监控的资源标签白名单 */
const RESOURCE_TAGS = ['SCRIPT', 'LINK', 'IMG', 'AUDIO', 'VIDEO', 'IFRAME', 'SOURCE'] as const;

/**
 * 是否为资源加载错误事件。
 *
 * 通过 target.tagName 判断事件目标是否是已知资源标签。
 */
function isResourceEvent(event: Event): boolean {
  const target = event.target;
  if (!target || !((target as HTMLElement).tagName)) return false
  const tag = (target as HTMLElement).tagName.toUpperCase();
  return (RESOURCE_TAGS as readonly string[]).includes(tag);
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

  const { js = true, promise = true, resource = true, onError, maxErrors = 100 } = options ?? {};

  const errors: ErrorInfo[] = [];

  function collect(info: ErrorInfo): void {
    errors.push(info);
    if (maxErrors > 0 && errors.length > maxErrors) {
      errors.shift();
    }
    onError?.(info);
  }

  const errorHandler = (event: Event): void => {
    // JS 运行时错误（ErrorEvent 含有 message 属性）
    if ('message' in event && typeof (event as Record<string, unknown>).message === 'string') {
      if (!js) return
      const evt = event as ErrorEvent;
      collect({
        type: 'js',
        message: evt.message,
        filename: evt.filename,
        lineno: evt.lineno,
        colno: evt.colno,
        error: evt.error,
        timestamp: Date.now(),
      })
      return;
    }

    // 资源加载失败
    if (!resource) return
    if (!isResourceEvent(event)) return

    const target = event.target as HTMLElement;
    const tag = target.tagName.toUpperCase();
    let url = '';
    if (tag === 'LINK') {
      url = (target as HTMLLinkElement).href;
    } else {
      url = (target as HTMLScriptElement | HTMLImageElement).src ?? '';
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

  window.addEventListener('error', errorHandler, { capture: true });
  window.addEventListener('unhandledrejection', rejectionHandler);

  return {
    getErrors: () => [...errors],
    stop: () => {
      window.removeEventListener('error', errorHandler, { capture: true });
      window.removeEventListener('unhandledrejection', rejectionHandler);
    },
  }
}
