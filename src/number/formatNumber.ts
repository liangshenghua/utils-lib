/**
 * 将数字格式化为千分位分隔的字符串。
 *
 * @param value - 待格式化的数值
 * @returns 千分位格式化后的字符串
 * @example
 * formatNumber(1234567)       // => "1,234,567"
 * formatNumber(1234567.89)    // => "1,234,567.89"
 * formatNumber(-1234567.89)   // => "-1,234,567.89"
 * formatNumber(-0.123)        // => "-0.123"
 * formatNumber(0)             // => "0"
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);

  const [integerPart, decimalPart] = String(value).split('.');
  const sign = integerPart!.startsWith('-') ? '-' : '';
  const absInteger = sign ? integerPart!.slice(1) : integerPart!;
  const formattedInteger = absInteger.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

  return decimalPart !== undefined
    ? `${sign}${formattedInteger}.${decimalPart}`
    : `${sign}${formattedInteger}`;
}
