import { describe, expect, it } from 'vitest';
import { mask } from '../../src/string/mask.js';

describe('mask', () => {
  it('手机号中间四位脱敏', () => {
    expect(mask('13812345678', 3, 4)).toBe('138****5678');
  });

  it('身份证号中间八位脱敏', () => {
    expect(mask('110101199001011234', 6, 4)).toBe('110101********1234');
  });

  it('自定义脱敏字符', () => {
    expect(mask('hello', 1, 1, '#')).toBe('h###o');
  });

  it('开头保留 0 位', () => {
    expect(mask('hello', 0, 2)).toBe('***lo');
  });

  it('结尾保留 0 位', () => {
    expect(mask('hello', 2, 0)).toBe('he***');
  });

  it('全部脱敏', () => {
    expect(mask('abc', 0, 0)).toBe('***');
  });

  it('keepStart + keepEnd 超出长度时原样返回', () => {
    expect(mask('abc', 5, 0)).toBe('abc');
    expect(mask('abc', 2, 2)).toBe('abc');
    expect(mask('abc', 3, 0)).toBe('abc');
  });

  it('空字符串返回空', () => {
    expect(mask('')).toBe('');
  });

  it('单个字符，不脱敏', () => {
    expect(mask('a', 1, 0)).toBe('a');
  });

  it('默认参数不保留任何字符', () => {
    expect(mask('hello')).toBe('*****');
  });

  it('keepEnd 传负数视为 0', () => {
    expect(mask('test@example.com', 1, -1)).toBe('t***************');
  });
});
