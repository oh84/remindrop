import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware, optionalAuthMiddleware } from './auth';
import type { User, Session } from '../lib/auth';

// auth モジュールをモック
vi.mock('../lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// モック用のヘルパー関数
const createMockSession = (
  userId: string = 'user-123',
  sessionId: string = 'session-123'
): { user: User; session: Session } => {
  const now = new Date();
  return {
    user: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
      image: null,
      createdAt: now,
      updatedAt: now,
    } as User,
    session: {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      token: 'mock-token',
      createdAt: now,
      updatedAt: now,
      ipAddress: null,
      userAgent: null,
    } as Session,
  };
};

describe('authMiddleware', () => {
  let app: Hono<{ Variables: { user: User; session: Session } }>;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should allow access when session is valid', async () => {
      const mockSession = createMockSession('user-123', 'session-123');

      const { auth } = await import('../lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      app.use('/protected', authMiddleware);
      app.get('/protected', (c) => {
        const user = c.get('user');
        const session = c.get('session');
        return c.json({ user, session });
      });

      const res = await app.request('/protected', {
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { user: User; session: Session };
      expect(data.user.id).toBe(mockSession.user.id);
      expect(data.user.email).toBe(mockSession.user.email);
      expect(data.session.id).toBe(mockSession.session.id);
      expect(data.session.userId).toBe(mockSession.session.userId);
    });

    it('should return 401 when session is invalid', async () => {
      const { auth } = await import('../lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      app.use('/protected', authMiddleware);
      app.get('/protected', (c) => c.json({ message: 'success' }));

      const res = await app.request('/protected');

      expect(res.status).toBe(401);
      const data = (await res.json()) as { error: string; code: string };
      expect(data).toEqual({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should return 401 when no session header is provided', async () => {
      const { auth } = await import('../lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      app.use('/protected', authMiddleware);
      app.get('/protected', (c) => c.json({ message: 'success' }));

      const res = await app.request('/protected');

      expect(res.status).toBe(401);
    });

    it('should set user and session in context', async () => {
      const mockSession = createMockSession('user-456', 'session-456');

      const { auth } = await import('../lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      app.use('/protected', authMiddleware);
      app.get('/protected', (c) => {
        const user = c.get('user');
        const session = c.get('session');
        expect(user.id).toBe(mockSession.user.id);
        expect(session.id).toBe(mockSession.session.id);
        return c.json({ ok: true });
      });

      const res = await app.request('/protected', {
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      expect(res.status).toBe(200);
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should allow access when session is valid', async () => {
      const mockSession = createMockSession('user-123', 'session-123');

      const { auth } = await import('../lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      app.use('/optional', optionalAuthMiddleware);
      app.get('/optional', (c) => {
        const user = c.get('user');
        const session = c.get('session');
        return c.json({ user, session, isAuthenticated: !!user });
      });

      const res = await app.request('/optional', {
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        user: User;
        session: Session;
        isAuthenticated: boolean;
      };
      expect(data.user.id).toBe(mockSession.user.id);
      expect(data.session.id).toBe(mockSession.session.id);
      expect(data.isAuthenticated).toBe(true);
    });

    it('should allow access when session is invalid (no error)', async () => {
      const { auth } = await import('../lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      app.use('/optional', optionalAuthMiddleware);
      app.get('/optional', (c) => {
        const user = c.get('user');
        return c.json({ isAuthenticated: !!user });
      });

      const res = await app.request('/optional');

      expect(res.status).toBe(200);
      const data = (await res.json()) as { isAuthenticated: boolean };
      expect(data.isAuthenticated).toBe(false);
    });

    it('should not set user in context when session is invalid', async () => {
      const { auth } = await import('../lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      app.use('/optional', optionalAuthMiddleware);
      app.get('/optional', (c) => {
        const user = c.get('user');
        const session = c.get('session');
        expect(user).toBeUndefined();
        expect(session).toBeUndefined();
        return c.json({ ok: true });
      });

      const res = await app.request('/optional');

      expect(res.status).toBe(200);
    });

    it('should set user and session in context when valid', async () => {
      const mockSession = createMockSession('user-789', 'session-789');

      const { auth } = await import('../lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      app.use('/optional', optionalAuthMiddleware);
      app.get('/optional', (c) => {
        const user = c.get('user');
        const session = c.get('session');
        expect(user?.id).toBe(mockSession.user.id);
        expect(session?.id).toBe(mockSession.session.id);
        return c.json({ ok: true });
      });

      const res = await app.request('/optional', {
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });

      expect(res.status).toBe(200);
    });
  });
});
