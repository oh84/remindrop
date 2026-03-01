import { createMiddleware } from 'hono/factory';
import type { AuthVariables } from './auth';

const AI_RATE_LIMIT = 10;
const AI_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * In-memory rate limiter for AI endpoints.
 * Limits each user to AI_RATE_LIMIT requests per AI_RATE_WINDOW_MS window.
 * Note: state resets on process restart / Lambda cold start.
 * For production, use API Gateway throttling or a persistent store.
 */
export const aiRateLimitMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const user = c.get('user');
    const key = `ai:${user.id}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + AI_RATE_WINDOW_MS };
      store.set(key, entry);
    }

    entry.count++;

    c.header('X-RateLimit-Limit', String(AI_RATE_LIMIT));
    c.header('X-RateLimit-Remaining', String(Math.max(0, AI_RATE_LIMIT - entry.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > AI_RATE_LIMIT) {
      return c.json({ error: 'AI機能のレート制限を超えました。しばらくしてからお試しください。' }, 429);
    }

    await next();
  }
);
