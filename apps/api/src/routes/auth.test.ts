import { describe, it, expect, vi, beforeEach } from 'vitest';
import authRoutes from './auth';

// auth モジュールをモック
vi.mock('../lib/auth', () => ({
  auth: {
    handler: vi.fn(),
  },
}));

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BetterAuth handler integration', () => {
    it('should mount BetterAuth handler on all routes', async () => {
      const { auth } = await import('../lib/auth');
      
      // BetterAuth が Request を返すようにモック
      vi.mocked(auth.handler).mockResolvedValue(
        new Response(JSON.stringify({ message: 'auth handler called' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('http://localhost/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const res = await authRoutes.request(req);

      expect(auth.handler).toHaveBeenCalled();
      expect(auth.handler).toHaveBeenCalledWith(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ message: 'auth handler called' });
    });

    it('should handle GET requests to auth routes', async () => {
      const { auth } = await import('../lib/auth');
      
      vi.mocked(auth.handler).mockResolvedValue(
        new Response(JSON.stringify({ session: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const res = await authRoutes.request(req);

      expect(auth.handler).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it('should handle POST requests to auth routes', async () => {
      const { auth } = await import('../lib/auth');
      
      vi.mocked(auth.handler).mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
              id: 'user-123',
              email: 'test@example.com',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const req = new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      });

      const res = await authRoutes.request(req);

      expect(auth.handler).toHaveBeenCalled();
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        user: { id: string; email: string };
      };
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
    });

    it('should handle PUT requests to auth routes', async () => {
      const { auth } = await import('../lib/auth');
      
      vi.mocked(auth.handler).mockResolvedValue(
        new Response(JSON.stringify({ message: 'updated' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('http://localhost/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      });

      const res = await authRoutes.request(req);

      expect(auth.handler).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it('should handle DELETE requests to auth routes', async () => {
      const { auth } = await import('../lib/auth');
      
      vi.mocked(auth.handler).mockResolvedValue(
        new Response(JSON.stringify({ message: 'signed out' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('http://localhost/api/auth/signout', {
        method: 'DELETE',
      });

      const res = await authRoutes.request(req);

      expect(auth.handler).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it('should pass request headers to BetterAuth handler', async () => {
      const { auth } = await import('../lib/auth');
      
      vi.mocked(auth.handler).mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('http://localhost/api/auth/session', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer token123',
          Cookie: 'session=abc123',
        },
      });

      await authRoutes.request(req);

      expect(auth.handler).toHaveBeenCalled();
      const mockCalls = vi.mocked(auth.handler).mock.calls;
      expect(mockCalls.length).toBeGreaterThan(0);
      const calledWithRequest = mockCalls[0]?.[0];
      expect(calledWithRequest).toBeInstanceOf(Request);
      if (calledWithRequest instanceof Request) {
        expect(calledWithRequest.headers.get('Authorization')).toBe(
          'Bearer token123'
        );
        expect(calledWithRequest.headers.get('Cookie')).toBe('session=abc123');
      }
    });

    it('should handle error responses from BetterAuth', async () => {
      const { auth } = await import('../lib/auth');
      
      vi.mocked(auth.handler).mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('http://localhost/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const res = await authRoutes.request(req);

      expect(auth.handler).toHaveBeenCalled();
      expect(res.status).toBe(401);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('route configuration', () => {
    it('should be an OpenAPIHono instance', () => {
      expect(authRoutes).toBeDefined();
      expect(typeof authRoutes.request).toBe('function');
    });

    it('should handle wildcard routes', async () => {
      const { auth } = await import('../lib/auth');
      
      vi.mocked(auth.handler).mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // 任意のパスでも BetterAuth ハンドラーが呼ばれることを確認
      const paths = [
        '/signin',
        '/signup',
        '/signout',
        '/session',
        '/refresh',
        '/custom-path',
      ];

      for (const path of paths) {
        vi.clearAllMocks();
        const req = new Request(`http://localhost${path}`, {
          method: 'GET',
        });
        const response = await authRoutes.request(req);
        expect(auth.handler).toHaveBeenCalled();
        expect(response).toBeDefined();
      }
    });
  });
});
