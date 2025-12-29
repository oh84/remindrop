import { env } from '@/env';

/**
 * カスタムfetchインスタンス
 * BetterAuthのCookieを自動的に送信するためにcredentials: 'include'を設定
 * Orvalで使用するための型定義
 *
 * @see https://orval.dev/guides/custom-client
 */
export type CustomInstance = <T>(
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    params?: Record<string, unknown>;
    data?: unknown;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  },
  options?: RequestInit
) => Promise<T>;

export const customInstance: CustomInstance = async <T>(
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    params?: Record<string, unknown>;
    data?: unknown;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  },
  options?: RequestInit
): Promise<T> => {
  const baseURL = env.NEXT_PUBLIC_API_URL;
  const fullUrl = config.url.startsWith('http') ? config.url : `${baseURL}${config.url}`;

  // URLパラメータを追加
  const url = new URL(fullUrl);
  if (config.params) {
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...options, // 先にoptionsを展開
    method: config.method,
    credentials: 'include', // Cookieを自動的に送信
    headers: {
      ...options?.headers, // 先にoptionsを展開
      ...config.headers,
      'Content-Type': 'application/json',
    },
    body: config.data ? JSON.stringify(config.data) : options?.body,
    signal: config.signal ?? options?.signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `API Error: ${response.status} ${response.statusText}`,
    }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  // 204 No Contentの場合は空のオブジェクトを返す
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
