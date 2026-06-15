/** 水印配置选项 */
export interface WatermarkConfig {
  /** 水印文字 */
  text: string;
  /** 字体大小（px） */
  fontSize: number;
  /** 字体颜色 */
  color: string;
  /** 旋转角度（deg） */
  rotate: number;
  /** 水印单元格间距 [水平间距, 垂直间距]（px） */
  gap: [number, number];
  /** 层叠顺序 */
  zIndex: number;
  /** 定位模式：'fixed' 相对视口 | 'absolute' 相对容器 */
  mode: 'fixed' | 'absolute';
  /** 字体族 */
  fontFamily: string;
}

/** 水印控制对象 */
export interface WatermarkInstance {
  /** 销毁水印，移除 DOM 并断开观察器 */
  destroy(): void;
  /** 挂载水印到容器 */
  mount(): void;
  /** 动态更新水印参数并重绘 */
  update(newOptions: Partial<WatermarkConfig>): void;
}
