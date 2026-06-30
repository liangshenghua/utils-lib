import { describe, expect, it } from 'vitest';
import { setURLParams } from '../../src/url/index.js';

describe('setURLParams', () => {
  it('新增参数到已有 query string', () => {
    expect(setURLParams('https://example.com/page?a=1', { b: '2' })).toBe(
      'https://example.com/page?a=1&b=2',
    );
  });

  it('覆盖已有参数', () => {
    expect(setURLParams('https://example.com/page?a=1', { a: '2' })).toBe(
      'https://example.com/page?a=2',
    );
  });

  it('无 query string 时新增', () => {
    expect(setURLParams('https://example.com/page', { a: '1' })).toBe(
      'https://example.com/page?a=1',
    );
  });

  it('纯 query string 输入', () => {
    expect(setURLParams('?a=1', { b: '2' })).toBe('?a=1&b=2');
  });

  it('传入数字类型值', () => {
    expect(setURLParams('?a=1', { c: 2 })).toBe('?a=1&c=2');
  });

  it('空参数对象返回原 URL', () => {
    expect(setURLParams('https://example.com/page?a=1', {})).toBe(
      'https://example.com/page?a=1',
    );
  });

  it('覆盖所有参数并新增多个', () => {
    expect(setURLParams('?a=1&b=2', { a: '10', c: '3' })).toBe('?a=10&b=2&c=3');
  });

  it('空 URL 输入', () => {
    expect(setURLParams('', { a: '1' })).toBe('?a=1');
  });

  it('保留 URL hash 片段', () => {
    expect(setURLParams('https://example.com/page?a=1#section', { b: '2' })).toBe(
      'https://example.com/page?a=1&b=2#section',
    );
  });

  it('无 query 时保留 hash 片段', () => {
    expect(setURLParams('https://example.com/page#section', { a: '1' })).toBe(
      'https://example.com/page?a=1#section',
    );
  });
});
