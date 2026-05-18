import { describe, expect, it } from 'vitest';
import { getURLParamsAll } from '../../src/url/index.js';

describe('getURLParamsAll', () => {
  it('解析多个查询参数', () => {
    expect(getURLParamsAll('?name=jack&age=18')).toEqual({
      name: 'jack',
      age: '18',
    });
  });

  it('单个查询参数', () => {
    expect(getURLParamsAll('?key=value')).toEqual({ key: 'value' });
  });

  it('无查询参数返回空对象', () => {
    expect(getURLParamsAll('?')).toEqual({});
  });

  it('空字符串返回空对象', () => {
    expect(getURLParamsAll('')).toEqual({});
  });

  it('只传 base URL 无 query string 返回空对象', () => {
    expect(getURLParamsAll('https://example.com')).toEqual({});
  });

  it('完整的 URL 也能正常解析', () => {
    expect(getURLParamsAll('https://example.com/path?a=1&b=2')).toEqual({
      a: '1',
      b: '2',
    });
  });

  it('参数值含特殊字符被正确解码', () => {
    expect(getURLParamsAll('?q=hello%20world')).toEqual({ q: 'hello world' });
  });
});
