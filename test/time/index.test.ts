import { describe, expect, it } from 'vitest';
import { truncateTime } from '../../src/time/index.js';

describe('truncateTime', () => {
  describe('day 精度 — 仅保留日期', () => {
    it('空格分隔，标准时间字符串', () => {
      expect(truncateTime('2026-05-20 06:18:18', 'day')).toBe('2026-05-20');
    });

    it('T 分隔，ISO 格式', () => {
      expect(truncateTime('2026-05-20T06:18:18', 'day')).toBe('2026-05-20');
    });

    it('斜杠日期，空格分隔', () => {
      expect(truncateTime('2026/05/20 06:18:18', 'day')).toBe('2026/05/20');
    });

    it('仅有日期时原样返回', () => {
      expect(truncateTime('2026-05-20', 'day')).toBe('2026-05-20');
    });
  });

  describe('hour 精度 — 保留到小时', () => {
    it('空格分隔', () => {
      expect(truncateTime('2026-05-20 06:18:18', 'hour')).toBe('2026-05-20 06');
    });

    it('T 分隔', () => {
      expect(truncateTime('2026-05-20T06:18:18', 'hour')).toBe('2026-05-20T06');
    });
  });

  describe('minute 精度 — 保留到分钟', () => {
    it('空格分隔', () => {
      expect(truncateTime('2026-05-20 06:18:18', 'minute')).toBe('2026-05-20 06:18');
    });

    it('T 分隔', () => {
      expect(truncateTime('2026-05-20T06:18:18', 'minute')).toBe('2026-05-20T06:18');
    });
  });

  describe('second 精度 — 完整时间', () => {
    it('空格分隔', () => {
      expect(truncateTime('2026-05-20 06:18:18', 'second')).toBe('2026-05-20 06:18:18');
    });

    it('无秒的时间补 00', () => {
      expect(truncateTime('2026-05-20 06:18', 'second')).toBe('2026-05-20 06:18:00');
    });
  });

  describe('边界情况', () => {
    it('非法格式返回原值', () => {
      expect(truncateTime('invalid', 'day')).toBe('invalid');
    });

    it('空字符串返回空字符串', () => {
      expect(truncateTime('', 'day')).toBe('');
    });

    it('仅有小时分钟无秒', () => {
      expect(truncateTime('2026-05-20 06:18', 'minute')).toBe('2026-05-20 06:18');
      expect(truncateTime('2026-05-20 06:18', 'hour')).toBe('2026-05-20 06');
      expect(truncateTime('2026-05-20 06:18', 'day')).toBe('2026-05-20');
    });
  });
});
