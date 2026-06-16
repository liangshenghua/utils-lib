/**
 * 将文本复制到剪切板。
 *
 * 优先使用 `navigator.clipboard.writeText`（现代异步 API），
 * 降级到 `document.execCommand('copy')`（旧浏览器兼容）。
 *
 * @param text - 要复制的文本
 * @returns 是否复制成功
 * @example
 * await copyToClipboard('hello world')
 * // => true
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 权限不足或非 HTTPS 环境，走 fallback
    }
  }

  if (typeof document === 'undefined') return false;

  return fallbackCopy(text);
}

/**
 * 通过创建临时 textarea 元素，使用 `document.execCommand('copy')` 复制文本。
 * 作为 Clipboard API 不可用或权限不足时的降级方案。
 */
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);

  try {
    textarea.select();
    const success = document.execCommand('copy');
    return success;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
