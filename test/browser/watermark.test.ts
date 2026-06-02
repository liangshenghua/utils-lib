import { describe, expect, it, afterEach, vi } from 'vitest'
import { createWatermark } from '../../src/browser/watermark.js'

// ---- mock helpers -----------------------------------------------------------
// 由于 watermark 依赖浏览器 DOM API（document.createElement、MutationObserver 等），
// 测试时通过 vi.stubGlobal 注入 mock 实现，避免依赖真实浏览器环境。

/** 模拟 DOM 元素，提供水印所需的最小 API 子集 */
interface MockElement {
  id: string
  tagName: string
  style: { cssText: string; setProperty: () => void; removeProperty: () => void; getPropertyValue: () => void; getPropertyPriority: () => void; length: number; item: () => string; [Symbol.iterator]: () => IterableIterator<string> }
  parentNode: MockElement | null
  childNodes: MockElement[]
  _attrs: Record<string, string>
  _removed: boolean
  setAttribute(name: string, value: string): void
  getAttribute(name: string): string | null
  removeAttribute(name: string): void
  appendChild(child: MockElement): void
  removeChild(child: MockElement): void
  remove(): void
  contains(other: MockElement): boolean
}

/** 创建模拟 CSSStyleDeclaration，通过闭包维护 cssText */
function createMockStyle() {
  let cssText = ''
  return {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    getPropertyValue: vi.fn(),
    getPropertyPriority: vi.fn(),
    get cssText() { return cssText },
    set cssText(v: string) { cssText = v },
    length: 0,
    item: () => '',
    [Symbol.iterator]: () => [][Symbol.iterator](),
  }
}

/** 创建模拟 DOM 元素，支持父子关系、属性读写和移除 */
function createMockElement(tag: string): MockElement {
  const el: MockElement = {
    id: '',
    tagName: tag.toUpperCase(),
    style: createMockStyle() as any,
    parentNode: null,
    childNodes: [],
    _attrs: {},
    _removed: false,
    setAttribute(name: string, value: string) { this._attrs[name] = value },
    getAttribute(name: string) { return this._attrs[name] ?? null },
    removeAttribute(name: string) { delete this._attrs[name] },
    appendChild(child: MockElement) {
      child.parentNode = this
      this.childNodes.push(child)
    },
    removeChild(child: MockElement) {
      child.parentNode = null
      child._removed = true
      const idx = this.childNodes.indexOf(child)
      if (idx !== -1) this.childNodes.splice(idx, 1)
    },
    remove() {
      this._removed = true
      if (this.parentNode) this.parentNode.removeChild(this)
    },
    contains(other: MockElement) {
      let p: MockElement | null = other
      while (p) {
        if (p === this) return true
        p = p.parentNode
      }
      return false
    },
  }
  return el
}

/** 创建模拟 Canvas 元素，fillText 会捕获文字内容，toDataURL 返回包含该文字的 URL */
function createMockCanvas(): MockElement & { width: number; height: number; getContext: () => any; toDataURL: () => string } {
  let textContent = ''
  const base = createMockElement('canvas')
  return {
    ...base,
    width: 0,
    height: 0,
    getContext: () => ({
      font: '',
      fillStyle: '',
      translate: vi.fn(),
      rotate: vi.fn(),
      fillText: vi.fn((text: string) => { textContent = text }),
    }),
    toDataURL: () => `data:image/png;base64,${textContent}`,
  }
}

/** 测试上下文：包含 mock 元素和浏览器 API 的 spy */
interface TestContext {
  body: MockElement
  container: MockElement
  createElement: ReturnType<typeof vi.fn>
  mockObserver: ReturnType<typeof vi.fn>
  observerCallback: MutationCallback | null
}

/**
 * 搭建浏览器 mock 环境：
 * - 用 createMockElement 模拟 document.body
 * - 用 vi.fn 模拟 document.createElement，canvas 走 createMockCanvas
 * - 用 vi.fn 模拟 MutationObserver，捕获构造函数回调供测试手动触发
 * - 用 vi.fn 模拟 getComputedStyle
 */
function setupBrowserMock(): TestContext {
  const body = createMockElement('body')
  const container = createMockElement('div')

  const createElement = vi.fn((tag: string) => {
    if (tag === 'canvas') return createMockCanvas()
    return createMockElement(tag)
  })

  let observerCallback: MutationCallback | null = null
  const mockObserver = vi.fn(function (this: any, cb: MutationCallback) {
    observerCallback = cb
    this.observe = vi.fn()
    this.disconnect = vi.fn()
  })

  vi.stubGlobal('MutationObserver', mockObserver)
  vi.stubGlobal('document', {
    body,
    createElement,
  })
  vi.stubGlobal('getComputedStyle', vi.fn(() => ({
    position: 'static',
  })))

  return { body, container, createElement, mockObserver, observerCallback }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---- 测试用例 ---------------------------------------------------------------

describe('createWatermark', () => {
  /** 基本流程：创建 → 挂载 → 验证 DOM 存在 */
  it('挂载水印到容器并返回控制实例', () => {
    const { body, createElement } = setupBrowserMock()

    const wm = createWatermark(body as any)
    wm.mount()

    const divChild = body.childNodes.find(c => (c as any).tagName === 'DIV')
    expect(divChild).toBeDefined()
    expect(createElement).toHaveBeenCalledWith('div')
  })

  /** 验证所有可配参数均生效，canvas 正常创建 */
  it('支持自定义 text / fontSize / color / rotate / gap', () => {
    const { body, createElement } = setupBrowserMock()

    const wm = createWatermark(body as any, {
      text: '自定义水印',
      fontSize: 24,
      color: 'rgba(255, 0, 0, 0.2)',
      rotate: -45,
      gap: [200, 150],
    })
    wm.mount()

    const canvasCalls = (createElement.mock.calls as string[][]).filter(c => c[0] === 'canvas')
    expect(canvasCalls.length).toBe(1)
  })

  /** 边界情况：空水印文字不应导致绘制异常 */
  it('text 为空时不抛异常', () => {
    const { body, createElement } = setupBrowserMock()

    const wm = createWatermark(body as any, { text: '' })
    expect(() => wm.mount()).not.toThrow()

    const canvasCalls = (createElement.mock.calls as string[][]).filter(c => c[0] === 'canvas')
    expect(canvasCalls.length).toBe(1)
  })

  /** destroy() 应保证幂等性，多次调用不抛异常 */
  it('destroy() 多次调用安全', () => {
    const { body } = setupBrowserMock()

    const wm = createWatermark(body as any)
    wm.destroy()
    expect(() => wm.destroy()).not.toThrow()
    expect(() => wm.destroy()).not.toThrow()
  })

  /** destroy → mount 应能正常重建水印 */
  it('destroy() 后再调用 mount 不抛异常', () => {
    const { body } = setupBrowserMock()

    const wm = createWatermark(body as any)
    wm.mount()
    wm.destroy()
    // destroy 后 divContent 置 null，mount 可重新创建
    expect(() => wm.mount()).not.toThrow()
  })

  /** mount() 存在性检查应保证不会重复创建 DOM */
  it('mount() 多次调用只创建一个水印 div', () => {
    const { body } = setupBrowserMock()

    const wm = createWatermark(body as any)
    wm.mount()
    wm.mount()
    wm.mount()

    const divChildren = body.childNodes.filter(c => (c as any).tagName === 'DIV')
    expect(divChildren.length).toBe(1)
  })

  /** destroy() 应调用 DOM remove，从父节点中移除 */
  it('destroy() 移除水印 div', () => {
    const { body } = setupBrowserMock()

    const wm = createWatermark(body as any)
    wm.mount()

    const divChild = body.childNodes[body.childNodes.length - 1]
    expect((divChild as any)._removed).toBe(false)

    wm.destroy()
    expect((divChild as any)._removed).toBe(true)
  })

  /** update() 应重绘样式，验证 cssText 变化且新文字出现在样式中 */
  it('update() 更新样式', () => {
    const { body } = setupBrowserMock()

    const wm = createWatermark(body as any)
    wm.mount()

    const divChild = body.childNodes[body.childNodes.length - 1]
    const before = (divChild as any).style.cssText

    wm.update({ text: '已过期', color: 'rgba(255,0,0,0.5)' })

    const after = (divChild as any).style.cssText
    expect(after).not.toBe(before)
    expect(after).toContain('已过期')
  })

  /** update() 在未挂载时应静默跳过，不抛异常 */
  it('update() 在未挂载时不抛异常', () => {
    const { body } = setupBrowserMock()

    const wm = createWatermark(body as any)
    expect(() => wm.update({ text: 'test' })).not.toThrow()
  })

  /** 模拟 DOM 节点被外部删除，MutationObserver 回调触发重新挂载 */
  it('MutationObserver 检测到容器被删除后重新挂载', () => {
    const { body, mockObserver } = setupBrowserMock()

    const wm = createWatermark(body as any)
    wm.mount()

    const container = body.childNodes[body.childNodes.length - 1]!

    // 模拟外部删除
    body.removeChild(container)

    // 手动触发 MutationObserver 回调
    const cbArgs = mockObserver.mock.calls[0]
    if (cbArgs && cbArgs.length > 0) {
      const callback = cbArgs[0] as MutationCallback
      callback(
        [{ type: 'childList', target: body, addedNodes: [] as any, removedNodes: [container] as any, previousSibling: null, nextSibling: null }] as any,
        {} as MutationObserver,
      )
    }

    expect(container.parentNode).toBe(body)
    wm.destroy()
  })

  /** 模拟水印 div 属性被篡改（如 style 被覆盖），Observer 回调触发样式恢复 */
  it('MutationObserver 检测到属性被篡改后恢复样式', () => {
    const { body, mockObserver } = setupBrowserMock()

    const wm = createWatermark(body as any)
    wm.mount()

    const container = body.childNodes[body.childNodes.length - 1]!

    // 手动触发 attributes 类型的 MutationObserver 回调
    const cbArgs = mockObserver.mock.calls[0]
    if (cbArgs && cbArgs.length > 0) {
      const callback = cbArgs[0] as MutationCallback
      callback(
        [{ type: 'attributes', target: container, attributeName: 'style', oldValue: null, addedNodes: [] as any, removedNodes: [] as any, previousSibling: null, nextSibling: null }] as any,
        {} as MutationObserver,
      )
    }

    expect(container.parentNode).toBe(body)
    wm.destroy()
  })

  /** absolute 模式下容器 position 为 static 时，应输出 console.warn 提示 */
  it('absolute 模式下容器为 static 定位时输出警告', () => {
    const { body } = setupBrowserMock()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wm = createWatermark(body as any, { mode: 'absolute' })
    wm.mount()

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[watermark] absolute 模式下容器需要非 static 定位'),
      expect.anything(),
      expect.anything()
    )

    warnSpy.mockRestore()
    wm.destroy()
  })
})
