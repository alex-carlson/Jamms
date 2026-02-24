/**
 * Cookie utility functions for persistent authentication
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

/**
 * Auth-specific cookie functions
 */
export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'google_access_token',
  USER_INFO: 'user_info',
  EXPIRES_AT: 'token_expires_at',
  SESSION_EXPIRES_AT: 'session_expires_at'
};

export const saveAuthData = (
  accessToken: string,
  userInfo: any,
  expiresIn: number = 3600,
  sessionDays: number = 7
) => {
  const expiresAt = Date.now() + (expiresIn * 1000);
  const sessionExpiresAt = Date.now() + (sessionDays * 24 * 60 * 60 * 1000);

  setCookie(AUTH_COOKIES.ACCESS_TOKEN, accessToken, { expires: sessionDays });
  setCookie(AUTH_COOKIES.USER_INFO, JSON.stringify(userInfo), { expires: sessionDays });
  setCookie(AUTH_COOKIES.EXPIRES_AT, expiresAt.toString(), { expires: sessionDays });
  setCookie(AUTH_COOKIES.SESSION_EXPIRES_AT, sessionExpiresAt.toString(), { expires: sessionDays });
};

export const getAuthData = () => {
  const accessToken = getCookie(AUTH_COOKIES.ACCESS_TOKEN);
  const userInfoStr = getCookie(AUTH_COOKIES.USER_INFO);
  const expiresAtStr = getCookie(AUTH_COOKIES.EXPIRES_AT);
  const sessionExpiresAtStr = getCookie(AUTH_COOKIES.SESSION_EXPIRES_AT);

  if (!accessToken || !userInfoStr || !expiresAtStr || !sessionExpiresAtStr) {
    return null;
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  const sessionExpiresAt = parseInt(sessionExpiresAtStr, 10);

  // Check if app session is expired
  if (Date.now() > sessionExpiresAt) {
    clearAuthData();
    return null;
  }

  try {
    const userInfo = JSON.parse(userInfoStr);
    return {
      accessToken,
      userInfo,
      expiresAt,
      sessionExpiresAt,
      tokenExpired: Date.now() > expiresAt
    };
  } catch (error) {
    console.error('Error parsing stored user info:', error);
    clearAuthData();
    return null;
  }
};

export const clearAuthData = () => {
  deleteCookie(AUTH_COOKIES.ACCESS_TOKEN);
  deleteCookie(AUTH_COOKIES.USER_INFO);
  deleteCookie(AUTH_COOKIES.EXPIRES_AT);
  deleteCookie(AUTH_COOKIES.SESSION_EXPIRES_AT);
};

export const isTokenExpiringSoon = (bufferMinutes: number = 5): boolean => {
  const expiresAtStr = getCookie(AUTH_COOKIES.EXPIRES_AT);
  if (!expiresAtStr) return true;

  const expiresAt = parseInt(expiresAtStr, 10);
  const bufferTime = bufferMinutes * 60 * 1000;

  return Date.now() > (expiresAt - bufferTime);
};