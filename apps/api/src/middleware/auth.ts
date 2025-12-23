import { createMiddleware } from 'hono/factory';
import { auth } from '../lib/auth';
import type { User, Session } from '../lib/auth';

// Honoのコンテキストに型を追加
export type AuthVariables = {
  user: User;
  session: Session;
};

/**
 * 認証ミドルウェア
 * リクエストヘッダーまたはCookieからセッションを検証
 */
export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        401
      );
    }

    // コンテキストにユーザーとセッション情報を追加
    c.set('user', session.user);
    c.set('session', session.session);

    await next();
  }
);

/**
 * オプショナル認証ミドルウェア
 * 認証されていなくてもエラーにならない
 */
export const optionalAuthMiddleware = createMiddleware<{
  Variables: Partial<AuthVariables>;
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (session) {
    c.set('user', session.user);
    c.set('session', session.session);
  }

  await next();
});
