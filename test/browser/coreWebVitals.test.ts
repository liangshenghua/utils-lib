import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { getLCP, getCLS, getFID } from '../../src/browser/coreWebVitals.js';

const SETTLE_TIMEOUT = 2000;
const MAX_TIMEOUT = 15000;

interface ObserverMock {
  trigger: (entries: any[]) => void;
  disconnect: ReturnType<typeof vi.fn>;
}

function createObserverMock(): ObserverMock {
  let callback: ((list: any) => void) | null = null;

  const disconnect = vi.fn(() => {
    callback = null;
  });

  globalThis.PerformanceObserver = class {
    constructor(cb: any) {
      callback = cb;
    }
    observe() {
      // noop
    }
    disconnect = disconnect;
  } as any;

  return {
    trigger: (entries: any[]) => {
      callback?.({ getEntries: () => entries });
    },
    disconnect,
  };
}

describe('getLCP', () => {
  let mock: ObserverMock;

  beforeEach(() => {
    vi.useFakeTimers();
    mock = createObserverMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('PerformanceObserver 不可用时返回 null', async () => {
    delete (globalThis as any).PerformanceObserver;
    await expect(getLCP()).resolves.toBeNull();
  });

  it('超时无 LCP 条目时返回 null', async () => {
    const promise = getLCP();
    await vi.advanceTimersByTimeAsync(MAX_TIMEOUT + 100);
    await expect(promise).resolves.toBeNull();
  });

  it('触发 LCP 条目后返回对应指标', async () => {
    const promise = getLCP();

    mock.trigger([
      { startTime: 1234, element: { tagName: 'IMG' }, url: 'https://example.com/hero.jpg' },
    ]);

    await vi.advanceTimersByTimeAsync(SETTLE_TIMEOUT + 100);

    await expect(promise).resolves.toEqual({
      value: 1234,
      element: 'IMG',
      url: 'https://example.com/hero.jpg',
    });
  });

  it('多个 LCP 条目时取最后一个', async () => {
    const promise = getLCP();

    mock.trigger([
      { startTime: 500, element: { tagName: 'DIV' }, url: '' },
    ]);

    mock.trigger([
      { startTime: 500, element: { tagName: 'DIV' }, url: '' },
      { startTime: 2000, element: { tagName: 'IMG' }, url: 'https://example.com/big.jpg' },
    ]);

    await vi.advanceTimersByTimeAsync(SETTLE_TIMEOUT + 100);

    await expect(promise).resolves.toEqual({
      value: 2000,
      element: 'IMG',
      url: 'https://example.com/big.jpg',
    });
  });

  it('无 element 和 url 时返回 undefined', async () => {
    const promise = getLCP();

    mock.trigger([
      { startTime: 800, element: null, url: '' },
    ]);

    await vi.advanceTimersByTimeAsync(SETTLE_TIMEOUT + 100);

    const result = await promise;
    expect(result!.value).toBe(800);
    expect(result!.element).toBeUndefined();
    expect(result!.url).toBe('');
  });
});

describe('getCLS', () => {
  let mock: ObserverMock;

  beforeEach(() => {
    vi.useFakeTimers();
    mock = createObserverMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('PerformanceObserver 不可用时返回 null', async () => {
    delete (globalThis as any).PerformanceObserver;
    await expect(getCLS()).resolves.toBeNull();
  });

  it('无偏移时返回 0', async () => {
    const promise = getCLS();
    await vi.advanceTimersByTimeAsync(MAX_TIMEOUT + 100);
    const result = await promise;
    expect(result!.value).toBe(0);
  });

  it('累加所有 LayoutShift 值', async () => {
    const promise = getCLS();

    mock.trigger([
      { value: 0.05, hadRecentInput: false },
    ]);

    mock.trigger([
      { value: 0.03, hadRecentInput: false },
    ]);

    await vi.advanceTimersByTimeAsync(MAX_TIMEOUT + 100);

    const result = await promise;
    expect(result!.value).toBeCloseTo(0.08);
  });

  it('跳过 hadRecentInput 为 true 的偏移', async () => {
    const promise = getCLS();

    mock.trigger([
      { value: 0.1, hadRecentInput: false },
      { value: 0.2, hadRecentInput: true },
      { value: 0.3, hadRecentInput: false },
    ]);

    await vi.advanceTimersByTimeAsync(MAX_TIMEOUT + 100);

    const result = await promise;
    expect(result!.value).toBeCloseTo(0.4);
  });
});

describe('getFID', () => {
  let mock: ObserverMock;

  beforeEach(() => {
    vi.useFakeTimers();
    mock = createObserverMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('PerformanceObserver 不可用时返回 null', async () => {
    delete (globalThis as any).PerformanceObserver;
    await expect(getFID()).resolves.toBeNull();
  });

  it('超时无输入时返回 null', async () => {
    const promise = getFID();
    await vi.advanceTimersByTimeAsync(MAX_TIMEOUT + 100);
    await expect(promise).resolves.toBeNull();
  });

  it('首次输入时返回延迟指标', async () => {
    const promise = getFID();

    mock.trigger([
      { name: 'pointerdown', startTime: 100, processingStart: 115 },
    ]);

    // FID resolves immediately, no need to advance time
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toEqual({
      value: 15,
      eventType: 'pointerdown',
    });
  });

  it('只响应首次输入，忽略后续输入', async () => {
    const promise = getFID();

    mock.trigger([
      { name: 'click', startTime: 200, processingStart: 210 },
    ]);

    // disconnect 应该在首次输入后被调用，第二次 trigger 不会再触发
    mock.trigger([
      { name: 'keydown', startTime: 500, processingStart: 520 },
    ]);

    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toEqual({
      value: 10,
      eventType: 'click',
    });
  });
});
