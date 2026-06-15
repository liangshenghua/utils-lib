import { describe, it, expect, vi, afterEach } from 'vitest';
import { debounce } from '../../src/function/debounce.js';

describe('debounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  })

  it('应在延迟后执行函数', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  })

  it('在延迟内重复调用应重置计时器', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  })

  it('leading 模式下首次调用立即执行', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100, { leading: true });

    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    debounced();
    expect(fn).toHaveBeenCalledTimes(2);
  })

  it('支持 cancel 取消待执行调用', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  })

  it('支持 flush 立即执行待调用', () => {
    vi.useFakeTimers();
    const fn = vi.fn((x: number) => x * 2);
    const debounced = debounce(fn, 100);

    debounced(5);
    const result = debounced.flush();

    expect(fn).toHaveBeenCalledWith(5);
    expect(result).toBe(10);
  })

  it('无待执行时 flush 返回 undefined', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    const result = debounced.flush();
    expect(result).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  })

  it('传递正确参数', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a', 1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a', 1);
  })

  it('cancel 后再次调用应重新计时', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();
    debounced();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  })
})
