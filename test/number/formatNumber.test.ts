import { describe, expect, it } from 'vitest';
import { formatNumber } from '../../src/number/formatNumber.js';

describe('formatNumber', () => {
  it('正整数千分位格式化', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('负整数千分位格式化', () => {
    expect(formatNumber(-1234567)).toBe('-1,234,567');
  });

  it('正小数千分位格式化', () => {
    expect(formatNumber(1234567.89)).toBe('1,234,567.89');
  });

  it('负小数千分位格式化', () => {
    expect(formatNumber(-1234567.89)).toBe('-1,234,567.89');
  });

  it('负数小数（仅小数部分）', () => {
    expect(formatNumber(-0.123)).toBe('-0.123');
  });

  it('0 返回 "0"', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('1000 返回 "1,000"', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('小于 1000 的数字不添加分隔符', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(1)).toBe('1');
  });

  it('负小于 1000 的数字不添加分隔符', () => {
    expect(formatNumber(-999)).toBe('-999');
    expect(formatNumber(-1)).toBe('-1');
  });

  it('多位小数', () => {
    expect(formatNumber(1234.56789)).toBe('1,234.56789');
  });

  it('NaN 返回 "NaN"', () => {
    expect(formatNumber(NaN)).toBe('NaN');
  });

  it('Infinity 返回 "Infinity"', () => {
    expect(formatNumber(Infinity)).toBe('Infinity');
  });

  it('-Infinity 返回 "-Infinity"', () => {
    expect(formatNumber(-Infinity)).toBe('-Infinity');
  });

  it('大数字千分位格式化', () => {
    expect(formatNumber(1234567890123)).toBe('1,234,567,890,123');
  });

  it('负数大数字千分位格式化', () => {
    expect(formatNumber(-1234567890123)).toBe('-1,234,567,890,123');
  });

  it('大数字带小数', () => {
    expect(formatNumber(12345678.12345)).toBe('12,345,678.12345');
  });
});
