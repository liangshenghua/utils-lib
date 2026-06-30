/**
 * 截断日期/时间字符串到指定精度，保留输入格式（分隔符、日期格式）。
 *
 * 支持格式：`YYYY-MM-DD` / `YYYY/MM/DD`，分隔符 `空格` / `T`。
 *
 * @param dateStr - 待截断的时间字符串
 * @param granularity - 截断精度：`'day'` | `'hour'` | `'minute'` | `'second'`
 * @returns 截断后的时间字符串；格式不可识别时返回原值
 * @example
 * truncateTime('2026-05-20 06:18:18', 'day')    // => '2026-05-20'
 * truncateTime('2026-05-20 06:18:18', 'hour')   // => '2026-05-20 06'
 * truncateTime('2026-05-20 06:18:18', 'minute') // => '2026-05-20 06:18'
 * truncateTime('2026-05-20 06:18:18', 'second') // => '2026-05-20 06:18:18'
 * truncateTime('2026/05/20 06:18:18', 'day')    // => '2026/05/20'
 * truncateTime('2026-05-20T06:18:18', 'hour')   // => '2026-05-20T06'
 * truncateTime('2026-05-20', 'day')             // => '2026-05-20'
 */
export function truncateTime(
  dateStr: string,
  granularity: 'day' | 'hour' | 'minute' | 'second',
): string {
  const match = dateStr.match(
    /^(\d{4}[/-]\d{2}[/-]\d{2})(?:([ T])(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  /*
    2026-05-20 06:18:18;
    2026-05-20   ([ T])   (\d{2})   :   (\d{2})   (?:  :   (\d{2})   )?;
    (日期)       空格      06        :    18           :     18         (结束);
    捕获组1     捕获组2   捕获组3        捕获组4          捕获组5;
  */
  if (!match) return dateStr;

  const datePart = match[1]!;
  const sep = match[2];
  const hh = match[3];
  const mm = match[4];
  const ss = match[5];

  if (!sep || !hh) return datePart;

  switch (granularity) {
    case 'day':
      return datePart;
    case 'hour':
      return `${datePart}${sep}${hh}`;
    case 'minute':
      return `${datePart}${sep}${hh}:${mm!}`;
    case 'second':
      return `${datePart}${sep}${hh}:${mm!}:${ss ?? '00'}`;
    default:
      return dateStr;
  }
}
