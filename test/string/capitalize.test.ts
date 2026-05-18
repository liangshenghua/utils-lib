import { describe, expect, it } from 'vitest';
import { capitalize } from '../../src/string/capitalize.js';

describe('capitalize', () => {
  it('将小写字母开头的字符串首字母转为大写', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('已大写的字符串保持不变', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('空字符串原样返回', () => {
    expect(capitalize('')).toBe('');
  });

  it('单个字符转为大写', () => {
    expect(capitalize('h')).toBe('H');
  });

  it('只改变首字符，其余字符不变', () => {
    expect(capitalize('hELLO')).toBe('HELLO');
  });
});
