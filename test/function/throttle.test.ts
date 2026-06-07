import { describe, it, expect, vi, afterEach } from 'vitest'
import { throttle } from '../../src/function/throttle.js'

describe('throttle', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('首次调用立即执行', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('等待期内不重复执行', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('等待结束后执行 trailing 调用', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('trailing 调用使用最新参数', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled(1)
    throttled(2)
    throttled(3)

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenNthCalledWith(1, 1)
    expect(fn).toHaveBeenNthCalledWith(2, 3)
  })

  it('支持 cancel 取消 trailing 调用', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled.cancel()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('在等待期内重复调用后再次触发应正常节流', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled() // t=0: 执行
    throttled() // t=0: 排队
    vi.advanceTimersByTime(100) // t=100: trailing 执行
    expect(fn).toHaveBeenCalledTimes(2)

    throttled() // t=100: 立即执行
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('无 trailing 调用时 cancel 安全执行', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled.cancel()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
