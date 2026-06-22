export interface CookieOptions {
  /** 过期天数，不指定则为会话 Cookie */
  expires?: number;
  /** Cookie 路径，默认 '/' */
  path?: string;
  /** Cookie 域名 */
  domain?: string;
  /** 仅 HTTPS 传输 */
  secure?: boolean;
  /** 仅允许服务端访问（HttpOnly），浏览器 JS 无法读写 */
  httpOnly?: boolean;
  /** SameSite 策略 */
  sameSite?: 'strict' | 'lax' | 'none';
  /** 最大存活时间（秒），优先级高于 expires */
  maxAge?: number;
}

/**
 * 获取指定名称的 Cookie 值。
 *
 * @param name - Cookie 名称
 * @returns Cookie 值，不存在时返回 null
 * @example
 * // 假设 document.cookie 为 'foo=hello; bar=world'
 * getCookie('foo') // => 'hello'
 * getCookie('baz') // => null
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const matches = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${encodeURIComponent(name)}\\s*=\\s*([^;]*)`),
  );
  return matches ? decodeURIComponent(matches[1]!) : null;
}

/**
 * 设置 Cookie。
 *
 * @param name   - Cookie 名称
 * @param value  - Cookie 值
 * @param options - 可选配置（过期天数、路径、域名等）
 * @example
 * setCookie('token', 'abc123', { expires: 7, path: '/' })
 * setCookie('lang', 'zh-CN', { domain: '.example.com', secure: true })
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  if (typeof document === 'undefined') return;

  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  const parts: string[] = [`${encodedName}=${encodedValue}`];

  if (options.maxAge != null) {
    parts.push(`max-age=${options.maxAge}`);
  } else if (options.expires != null) {
    const date = new Date();
    date.setDate(date.getDate() + options.expires);
    parts.push(`expires=${date.toUTCString()}`);
  }

  if (options.path != null) {
    parts.push(`path=${options.path}`);
  }
  if (options.domain != null) {
    parts.push(`domain=${options.domain}`);
  }
  if (options.secure) {
    parts.push('secure');
  }
  if (options.httpOnly) {
    parts.push('httponly');
  }
  if (options.sameSite) {
    parts.push(`samesite=${options.sameSite}`);
  }

  document.cookie = parts.join('; ');
}

/**
 * 删除指定 Cookie。
 *
 * @param name    - Cookie 名称
 * @param options - 删除配置（path / domain 需与设置时一致）
 * @example
 * removeCookie('token')
 * removeCookie('token', { path: '/admin', domain: '.example.com' })
 */
export function removeCookie(
  name: string,
  options: Omit<CookieOptions, 'expires' | 'maxAge'> = {},
): void {
  setCookie(name, '', {
    ...options,
    maxAge: 0,
  });
}
