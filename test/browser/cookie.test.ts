import { describe, expect, it, afterEach, vi, beforeEach } from 'vitest';
import { getCookie, setCookie, removeCookie } from '../../src/browser/cookie.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * 模拟 document.cookie，支持基本的追加/删除行为。
 */
function setupMockDocument(): void {
  const store = new Map<string, string>();

  vi.stubGlobal('document', {
    get cookie() {
      return Array.from(store.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    },
    set cookie(value: string) {
      const parts = value.split(';');
      const kv = parts[0]!;
      const eqIdx = kv.indexOf('=');
      const name = eqIdx > 0 ? kv.slice(0, eqIdx).trim() : '';
      const val = eqIdx > 0 ? kv.slice(eqIdx + 1) : '';

      const opts = parts.slice(1).reduce(
        (acc, part) => {
          const [pk, pv] = part.trim().toLowerCase().split('=');
          acc[pk!] = pv ?? '';
          return acc;
        },
        {} as Record<string, string>,
      );

      if (opts['max-age'] === '0') {
        store.delete(name);
      } else {
        store.set(name, val);
      }
    },
  });
}

describe('getCookie', () => {
  beforeEach(() => setupMockDocument());

  it('获取存在的 cookie', () => {
    document.cookie = 'foo=hello';
    expect(getCookie('foo')).toBe('hello');
  });

  it('获取不存在的 cookie 返回 null', () => {
    expect(getCookie('nonexistent')).toBe(null);
  });

  it('多个 cookie 中正确获取目标值', () => {
    document.cookie = 'a=1';
    document.cookie = 'b=2';
    document.cookie = 'c=3';
    expect(getCookie('b')).toBe('2');
  });

  it('SSR 环境无 document 返回 null', () => {
    vi.stubGlobal('document', undefined);
    expect(getCookie('foo')).toBe(null);
  });

  it('cookie 值为空字符串时返回空字符串', () => {
    document.cookie = 'empty=';
    expect(getCookie('empty')).toBe('');
  });

  it('cookie 名称包含特殊字符时能正确获取', () => {
    document.cookie = 'user%20name=test%20value';
    expect(getCookie('user name')).toBe('test value');
  });
});

describe('setCookie', () => {
  beforeEach(() => setupMockDocument());

  it('设置普通 cookie', () => {
    setCookie('foo', 'bar');
    expect(getCookie('foo')).toBe('bar');
  });

  it('设置带过期天数的 cookie', () => {
    setCookie('token', 'abc', { expires: 7 });
    expect(getCookie('token')).toBe('abc');
  });

  it('设置带 path 的 cookie', () => {
    setCookie('x', '1', { path: '/admin' });
    expect(getCookie('x')).toBe('1');
  });

  it('设置带 domain 的 cookie', () => {
    setCookie('lang', 'zh', { domain: '.example.com' });
    expect(getCookie('lang')).toBe('zh');
  });

  it('设置 secure cookie', () => {
    setCookie('secret', 'yes', { secure: true });
    expect(getCookie('secret')).toBe('yes');
  });

  it('设置 sameSite cookie', () => {
    setCookie('sess', 'x', { sameSite: 'strict' });
    expect(getCookie('sess')).toBe('x');
  });

  it('maxAge 优先级高于 expires', () => {
    setCookie('temp', 'val', { maxAge: 3600, expires: 7 });
    expect(getCookie('temp')).toBe('val');
  });

  it('覆盖已存在的 cookie', () => {
    setCookie('key', 'old');
    setCookie('key', 'new');
    expect(getCookie('key')).toBe('new');
  });

  it('cookie 值包含中文', () => {
    setCookie('name', '张三');
    expect(getCookie('name')).toBe('张三');
  });

  it('SSR 环境无 document 不报错', () => {
    vi.stubGlobal('document', undefined);
    expect(() => setCookie('foo', 'bar')).not.toThrow();
  });
});

describe('removeCookie', () => {
  beforeEach(() => setupMockDocument());

  it('删除已存在的 cookie', () => {
    setCookie('foo', 'bar');
    expect(getCookie('foo')).toBe('bar');

    removeCookie('foo');
    expect(getCookie('foo')).toBe(null);
  });

  it('删除不存在的 cookie 不报错', () => {
    expect(() => removeCookie('nonexistent')).not.toThrow();
  });

  it('多次 set/get 后正确删除', () => {
    setCookie('a', '1');
    setCookie('b', '2');
    removeCookie('a');
    expect(getCookie('a')).toBe(null);
    expect(getCookie('b')).toBe('2');
  });

  it('带 path 参数删除', () => {
    setCookie('x', '1', { path: '/admin' });
    removeCookie('x', { path: '/admin' });
    expect(getCookie('x')).toBe(null);
  });

  it('SSR 环境无 document 不报错', () => {
    vi.stubGlobal('document', undefined);
    expect(() => removeCookie('foo')).not.toThrow();
  });
});
