import { describe, expect, it, afterEach, vi } from 'vitest';
import { startErrorMonitor } from '../../src/browser/errorMonitor.js';
import type { JsErrorInfo, PromiseErrorInfo, ResourceErrorInfo } from '../../src/browser/errorMonitor.js';

interface HandlerMap {
  error?: (event: any) => void;
  unhandledrejection?: (event: any) => void;
}

function setupMockWindow(): { handlers: HandlerMap } {
  const handlers: HandlerMap = {}

  vi.stubGlobal('window', {
    addEventListener: (type: string, handler: Function) => {
      handlers[type as keyof HandlerMap] = handler as any;
    },
    removeEventListener: (type: string) => {
      delete handlers[type as keyof HandlerMap];
    },
  })

  return { handlers };
}

afterEach(() => {
  vi.unstubAllGlobals();
})

describe('startErrorMonitor', () => {
  it('SSR 环境（无 window）返回无操作对象', () => {
    vi.stubGlobal('window', undefined);

    const monitor = startErrorMonitor();
    expect(monitor.getErrors()).toEqual([]);
    expect(() => monitor.stop()).not.toThrow();
  })

  it('注册 error 和 unhandledrejection 事件监听', () => {
    const { handlers } = setupMockWindow();

    startErrorMonitor();

    expect(typeof handlers.error).toBe('function');
    expect(typeof handlers.unhandledrejection).toBe('function');
  })

  it('捕获 JS 运行时错误', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      message: 'test error',
      filename: 'https://example.com/app.js',
      lineno: 10,
      colno: 5,
      error: new Error('test error'),
    })

    const errors = monitor.getErrors();
    expect(errors).toHaveLength(1);
    const err = errors[0] as JsErrorInfo;
    expect(err.type).toBe('js');
    expect(err.message).toBe('test error');
    expect(err.filename).toBe('https://example.com/app.js');
    expect(err.lineno).toBe(10);
    expect(err.colno).toBe(5);
    expect(err.error).toBeInstanceOf(Error);
    expect(typeof err.timestamp).toBe('number');
  })

  it('捕获资源加载失败（SCRIPT）', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      target: { tagName: 'SCRIPT', src: 'https://example.com/bundle.js' },
    })

    const errors = monitor.getErrors();
    expect(errors).toHaveLength(1);
    const err = errors[0] as ResourceErrorInfo;
    expect(err.type).toBe('resource');
    expect(err.tag).toBe('SCRIPT');
    expect(err.url).toBe('https://example.com/bundle.js');
    expect(typeof err.timestamp).toBe('number');
  })

  it('捕获资源加载失败（LINK）', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      target: { tagName: 'LINK', href: 'https://example.com/style.css' },
    })

    const errors = monitor.getErrors();
    expect(errors).toHaveLength(1);
    const err = errors[0] as ResourceErrorInfo;
    expect(err.type).toBe('resource');
    expect(err.tag).toBe('LINK');
    expect(err.url).toBe('https://example.com/style.css');
  })

  it('捕获资源加载失败（IMG）', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      target: { tagName: 'IMG', src: 'https://example.com/photo.jpg' },
    })

    const errors = monitor.getErrors();
    expect(errors).toHaveLength(1);
    const err = errors[0] as ResourceErrorInfo;
    expect(err.type).toBe('resource');
    expect(err.tag).toBe('IMG');
    expect(err.url).toBe('https://example.com/photo.jpg');
  })

  it('捕获未处理的 Promise 拒绝', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.unhandledrejection!({
      reason: new Error('promise failed'),
    })

    const errors = monitor.getErrors();
    expect(errors).toHaveLength(1);
    const err = errors[0] as PromiseErrorInfo;
    expect(err.type).toBe('unhandledrejection');
    expect(err.reason).toBeInstanceOf(Error);
    expect(typeof err.timestamp).toBe('number');
  })

  it('onError 回调在每次捕获时触发', () => {
    const { handlers } = setupMockWindow();
    const onError = vi.fn();

    startErrorMonitor({ onError });
    handlers.error!({
      message: 'err1',
      filename: '',
      lineno: 0,
      colno: 0,
      error: null,
    })

    expect(onError).toHaveBeenCalledTimes(1);
    const arg = onError.mock.calls[0]![0] as JsErrorInfo;
    expect(arg.type).toBe('js');
  })

  it('maxErrors 限制错误数量', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor({ maxErrors: 2 });
    for (let i = 0; i < 3; i++) {
      handlers.error!({
        message: `err${i}`,
        filename: '',
        lineno: i,
        colno: 0,
        error: null,
      })
    }

    const errors = monitor.getErrors();
    expect(errors).toHaveLength(2);
    // 最早的错误应被丢弃（lineno: 0 被丢弃，剩下 lineno: 1 和 2）
    expect((errors[0] as JsErrorInfo).lineno).toBe(1);
    expect((errors[1] as JsErrorInfo).lineno).toBe(2);
  })

  it('stop() 移除事件监听器', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    monitor.stop();

    expect(handlers.error).toBeUndefined();
    expect(handlers.unhandledrejection).toBeUndefined();
  })

  it('stop() 后 getErrors() 仍可访问已收集的错误', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      message: 'test',
      filename: '',
      lineno: 0,
      colno: 0,
      error: null,
    })
    monitor.stop();

    expect(monitor.getErrors()).toHaveLength(1);
  })

  it('getErrors() 返回防篡改拷贝', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      message: 'test',
      filename: '',
      lineno: 0,
      colno: 0,
      error: null,
    })

    const errors = monitor.getErrors();
    expect(errors).toHaveLength(1);
    // 修改返回的拷贝不应影响内部
    ;(errors as any[]).push({ type: 'fake' });
    expect(monitor.getErrors()).toHaveLength(1);
  })

  it('js: false 时不捕获 JS 错误', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor({ js: false });
    handlers.error!({
      message: 'test',
      filename: '',
      lineno: 0,
      colno: 0,
      error: null,
    })

    expect(monitor.getErrors()).toHaveLength(0);
  })

  it('resource: false 时不捕获资源加载失败', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor({ resource: false });
    handlers.error!({
      target: { tagName: 'SCRIPT', src: 'https://example.com/bundle.js' },
    })

    expect(monitor.getErrors()).toHaveLength(0);
  })

  it('promise: false 时不捕获未处理的 Promise 拒绝', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor({ promise: false });
    handlers.unhandledrejection!({ reason: 'fail' });

    expect(monitor.getErrors()).toHaveLength(0);
  })

  it('非资源标签不捕获为 resource 错误', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      target: { tagName: 'DIV' },
    })

    expect(monitor.getErrors()).toHaveLength(0);
  })

  it('target 为 null 时不抛出异常', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      target: null,
    })

    expect(monitor.getErrors()).toHaveLength(0);
  })

  it('资源 URL 为空时不捕获', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    handlers.error!({
      target: { tagName: 'SCRIPT', src: '' },
    })

    expect(monitor.getErrors()).toHaveLength(0);
  })

  it('多次调用 stop() 安全', () => {
    const { handlers } = setupMockWindow();

    const monitor = startErrorMonitor();
    monitor.stop();
    expect(() => monitor.stop()).not.toThrow();
  })
})
