/** JS 运行时错误信息 */
export interface JsErrorInfo {
  type: 'js';
  /** 错误消息 */
  message: string;
  /** 错误发生的文件 URL */
  filename: string;
  /** 行号 */
  lineno: number;
  /** 列号 */
  colno: number;
  /** 错误对象 */
  error: Error | null;
  /** 捕获时间戳（ms） */
  timestamp: number;
}

/** 未处理的 Promise 拒绝信息 */
export interface PromiseErrorInfo {
  type: 'unhandledrejection';
  /** rejection 原因值 */
  reason: unknown;
  /** 捕获时间戳（ms） */
  timestamp: number;
}

/** 资源加载失败信息 */
export interface ResourceErrorInfo {
  type: 'resource';
  /** 资源标签名（大写，如 SCRIPT / LINK / IMG） */
  tag: string;
  /** 资源 URL */
  url: string;
  /** 捕获时间戳（ms） */
  timestamp: number;
}

/** 错误信息联合类型 */
export type ErrorInfo = JsErrorInfo | PromiseErrorInfo | ResourceErrorInfo;

/** 错误监控配置选项 */
export interface ErrorMonitorOptions {
  /** 是否捕获 JS 运行时错误，默认 true */
  js?: boolean;
  /** 是否捕获未处理的 Promise 拒绝，默认 true */
  promise?: boolean;
  /** 是否捕获资源加载失败，默认 true */
  resource?: boolean;
  /** 每次捕获到错误时的回调 */
  onError?: (error: ErrorInfo) => void;
  /** 最多保存的错误数量，超出后丢弃最早错误，默认 100 */
  maxErrors?: number;
}

/** 错误监控控制对象 */
export interface ErrorMonitor {
  /** 获取已捕获错误的只读列表 */
  getErrors(): readonly ErrorInfo[];
  /** 停止监听并清理事件监听器 */
  stop(): void;
}
