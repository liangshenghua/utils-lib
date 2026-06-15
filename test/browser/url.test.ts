import { describe, expect, it, afterEach, vi } from 'vitest';
import { setCurrentURLParams } from '../../src/browser/url.js';

afterEach(() => {
  vi.unstubAllGlobals();
})

function setupMockWindow(href = 'https://example.com/page?a=1') {
  const replaceState = vi.fn();
  const pushState = vi.fn();
  vi.stubGlobal('window', {
    location: { href },
    history: { replaceState, pushState },
  })
  return { replaceState, pushState };
}

describe('setCurrentURLParams', () => {
  it('replaceState 新增参数', () => {
    const { replaceState } = setupMockWindow();
    setCurrentURLParams({ b: '2' });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      'https://example.com/page?a=1&b=2',
    );
  })

  it('replaceState 覆盖已有参数', () => {
    const { replaceState } = setupMockWindow();
    setCurrentURLParams({ a: '2' });
    expect(replaceState).toHaveBeenCalledWith(null, '', 'https://example.com/page?a=2');
  })

  it('pushState 模式', () => {
    const { pushState } = setupMockWindow();
    setCurrentURLParams({ b: '2' }, false);
    expect(pushState).toHaveBeenCalledWith(null, '', 'https://example.com/page?a=1&b=2');
  })

  it('SSR 环境无 window 不报错', () => {
    // window 未 stub，即为 undefined
    expect(() => setCurrentURLParams({ a: '1' })).not.toThrow();
  })
})
