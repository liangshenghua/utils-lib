/**
 * 将字符串首字母转为大写，其余部分保持不变。
 *
 * @param input - 待处理的字符串
 * @returns 首字母大写后的字符串
 * @example
 * capitalize('hello')  // => 'Hello'
 * capitalize('Hello')  // => 'Hello'
 * capitalize('')       // => ''
 */
export function capitalize(input: string): string {
  if (input.length === 0) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}
