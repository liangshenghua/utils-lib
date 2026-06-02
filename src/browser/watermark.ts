import type { WatermarkConfig, WatermarkInstance } from './watermarkTypes'

/** 水印默认配置 */
const DEFAULTS: WatermarkConfig = {
  text: '仅供内部使用',
  fontSize: 16,
  color: 'rgba(0,0,0,0.12)',
  rotate: -20,
  gap: [160, 100],
  zIndex: 9999,
  mode: 'fixed',
  fontFamily: 'sans-serif'
}

/**
 * 创建网页水印，支持防篡改（MutationObserver 监控 DOM 变更）。
 *
 * @param container - 水印挂载的目标容器元素
 * @param options   - 水印配置选项（可选，未提供时使用默认值）
 * @returns 水印控制实例，包含 mount / update / destroy 方法
 * @example
 * const wm = createWatermark(document.body, {
 *   text: '机密文件',
 *   rotate: -30,
 *   gap: [200, 150]
 * })
 * wm.mount()
 * wm.update({ text: '已过期' })
 * wm.destroy()
 */
export function createWatermark(
  container: HTMLElement,
  options: Partial<WatermarkConfig> = {}
): WatermarkInstance {
  let divContent: HTMLElement | null
  let observer: MutationObserver

  const cfg = { ...DEFAULTS, ...options }

  /** 生成 base64 水印图案（单次绘制，repeat 铺满） */
  function buildPattern(): string {
    const c = document.createElement('canvas')
    const [gw, gh] = cfg.gap ?? DEFAULTS.gap
    c.width = gw * 2
    c.height = gh * 2
    const ctx = c.getContext('2d')
    if (!ctx) {
      throw new Error('[watermark] 无法获取 Canvas 2D 上下文')
    }
    ctx.translate(gw, gh)
    ctx.rotate((cfg.rotate * Math.PI) / 180)
    ctx.font = `${cfg.fontSize}px ${cfg.fontFamily}`
    ctx.fillStyle = cfg.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(cfg.text, 0, 0)
    return c.toDataURL()
  }

  /** 生成 inline CSS 样式文本 */
  function getStyleText(): string {
    const position = cfg.mode === 'fixed' ? 'fixed' : 'absolute'
    return [
      `position:${position}`,
      'inset:0',
      'pointer-events:none',
      `z-index:${cfg.zIndex}`,
      'display:block !important',
      'visibility:visible !important',
      'opacity:1 !important',
      `background:url(${buildPattern()})`
    ].join(';')
  }

  /** 挂载水印 DOM 到容器，并启动监控 */
  function mount(): void {
    if (divContent) return
    if (cfg.mode === 'absolute') {
      const cs = getComputedStyle(container)
      if (cs.position === 'static') {
        console.warn(
          `[watermark] absolute 模式下容器需要非 static 定位，` +
          `当前容器`,
          container,
          `的 position 为 static，请在容器上设置 position: relative`
        )
      }
    }
    divContent = document.createElement('div')
    divContent.style.cssText = getStyleText()
    container.appendChild(divContent)
    watchDOM()
  }

  /** 启动 MutationObserver 防篡改监控 */
  function watchDOM(): void {
    function reconnect() {
      observer.observe(container, { childList: true })
      observer.observe(divContent!, {
        attributes: true,
        attributeFilter: ['style', 'class']
      })
    }

    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // 节点被移除 → 重新挂载
        for (const node of Array.from(m.removedNodes)) {
          if (node === divContent) {
            container.appendChild(divContent!)
            break
          }
        }
        // 属性被篡改（style / class）→ 恢复样式
        if (m.type === 'attributes' && m.target === divContent) {
          observer.disconnect()
          updateWatermark(cfg)
          reconnect()
        }
      }
    })
    reconnect()
  }

  /** 更新水印配置并强制重绘样式 */
  function updateWatermark(newOptions: Partial<WatermarkConfig>): void {
    if (!divContent) return
    Object.assign(cfg, newOptions)
    divContent.removeAttribute('class')
    divContent.style.cssText = getStyleText()
  }

  /** 销毁水印：断开观察器、移除 DOM 并释放引用 */
  function destroyWatermark(): void {
    observer?.disconnect()
    divContent?.remove()
    divContent = null
  }

  return {
    mount,
    destroy: destroyWatermark,
    update: updateWatermark
  }
}
