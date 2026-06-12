/**
 * 对字符串进行脱敏处理，将中间指定区间替换为脱敏字符。
 *
 * @param value - 原始字符串
 * @param keepStart - 开头保留的字符数，默认 0
 * @param keepEnd - 结尾保留的字符数，默认 0
 * @param maskChar - 脱敏字符，默认为 '*'
 * @returns 脱敏后的字符串
 * @example
 * mask('13812345678', 3, 4)        // => '138****5678'
 * mask('110101199001011234', 6, 4) // => '110101****1234'
 * mask('test@example.com', 1, -1)  // => 'test@example.com'  (keepEnd 负数视为 0)
 * mask('hello', 1, 1, '#')         // => 'h###o'
 * mask('abc', 5, 0)                // => 'abc'  (超出长度原样返回)
 * mask('')                         // => ''
 */
export function mask(value: string, keepStart = 0, keepEnd = 0, maskChar = '*'): string {
  if (!value) return value;

  const start = Math.max(0, keepStart);
  const end = Math.max(0, keepEnd);

  if (start + end >= value.length) return value;

  const head = value.slice(0, start);
  const tail = end > 0 ? value.slice(-end) : '';
  const masked = maskChar.repeat(value.length - start - end);

  return head + masked + tail;
}
