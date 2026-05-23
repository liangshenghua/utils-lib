import { describe, expect, it, afterEach, vi } from 'vitest';
import { getNavigationTiming, getPaintTiming } from '../../src/browser/performance.js';

function mockNavigationEntry(overrides?: Partial<PerformanceNavigationTiming>): PerformanceNavigationTiming {
  const defaults: PerformanceNavigationTiming = {
    domainLookupEnd: 100,
    domainLookupStart: 80,
    connectEnd: 150,
    connectStart: 120,
    secureConnectionStart: 125,
    responseStart: 350,
    requestStart: 250,
    responseEnd: 500,
    domInteractive: 600,
    domContentLoadedEventEnd: 650,
    domContentLoadedEventStart: 620,
    loadEventEnd: 1200,
    loadEventStart: 1100,
    startTime: 0,
    redirectEnd: 30,
    redirectStart: 0,
    redirectCount: 0,
    type: 'navigate',
    name: '',
    entryType: 'navigation',
    duration: 1200,
    initiatorType: 'navigation',
    domComplete: 1100,
    transferSize: 0,
    encodedBodySize: 0,
    decodedBodySize: 0,
    toJSON: () => ({}),
    fetchStart: 50,
    workerStart: 0,
    unloadEventStart: 0,
    unloadEventEnd: 0,
    nextHopProtocol: 'http/1.1',
    responseStatus: 200,
    serverTiming: [],
    ...overrides,
  };
  return defaults;
}

function mockPaintEntry(name: string, startTime: number): PerformanceEntry {
  return { name, entryType: 'paint', startTime, duration: 0, toJSON: () => ({}) };
}

describe('getNavigationTiming', () => {
  const originalPerformance = globalThis.performance;

  afterEach(() => {
    globalThis.performance = originalPerformance;
  });

  it('Performance API 不可用时返回 null', () => {
    globalThis.performance = undefined as any;
    expect(getNavigationTiming()).toBeNull();
  });

  it('无导航条目时返回 null', () => {
    globalThis.performance = { getEntriesByType: () => [] } as any;
    expect(getNavigationTiming()).toBeNull();
  });

  it('正确返回导航计时各阶段数据', () => {
    const nav = mockNavigationEntry();
    globalThis.performance = {
      getEntriesByType: (type: string) => (type === 'navigation' ? [nav] : []),
    } as any;

    const result = getNavigationTiming();
    expect(result).toEqual({
      dns: 20,
      tcp: 30,
      tls: 25,
      ttfb: 100,
      domParse: 100,
      domContentLoaded: 30,
      render: 550,
      total: 1200,
      redirect: 30,
      type: 'navigate',
    });
  });

  it('无 TLS 时 tls 为 0', () => {
    const nav = mockNavigationEntry({ secureConnectionStart: 0 });
    globalThis.performance = {
      getEntriesByType: (type: string) => (type === 'navigation' ? [nav] : []),
    } as any;

    expect(getNavigationTiming()!.tls).toBe(0);
  });
});

describe('getPaintTiming', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Performance API 不可用时返回 null', () => {
    vi.spyOn(globalThis, 'performance', 'get').mockReturnValue(undefined as any);
    expect(getPaintTiming()).toBeNull();
  });

  it('无 Paint 条目时返回 null', () => {
    vi.spyOn(globalThis.performance, 'getEntriesByType').mockReturnValue([]);
    expect(getPaintTiming()).toBeNull();
  });

  it('正确返回 FP / FCP', () => {
    vi.spyOn(globalThis.performance, 'getEntriesByType').mockImplementation(
      (type: string) => {
        if (type === 'paint') {
          return [
            mockPaintEntry('first-paint', 120),
            mockPaintEntry('first-contentful-paint', 250),
          ];
        }
        return [];
      },
    );

    expect(getPaintTiming()).toEqual({ fp: 120, fcp: 250 });
  });
});
