/**
 * Cookie utility functions
 */

interface CookieOptions {
  expires?: number; // Days
  path?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
  if (typeof document === 'undefined') return;

  const {
    expires = 7, // Default 7 days
    path = '/',
    secure = true,
    sameSite = 'Lax'
  } = options;

  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + (expires * 24 * 60 * 60 * 1000));

  const cookieString = [
    `${name}=${encodeURIComponent(value)}`,
    `expires=${expirationDate.toUTCString()}`,
    `path=${path}`,
    secure ? 'secure' : '',
    `SameSite=${sameSite}`
  ].filter(Boolean).join('; ');

  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

export const deleteCookie = (name: string, path: string = '/') => {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};