import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import route from './route';
import { bookmarkService } from './service';

// Mock auth middleware
const mockAuthMiddleware = async (c: any, next: any) => {
  c.set('user', { id: 'user-123' });
  c.set('session', { id: 'session-123' });
  await next();
};

// Mock service
vi.mock('./service', () => ({
  bookmarkService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Bookmark Routes', () => {
  let app: OpenAPIHono<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new OpenAPIHono();
    app.use('*', mockAuthMiddleware);
    app.route('/', route);
  });

  describe('GET /', () => {
    it('should return list of bookmarks with pagination', async () => {
      const mockBookmarks = [{ id: '1', title: 'Test', url: 'https://test.com' }] as any;
      vi.mocked(bookmarkService.list).mockResolvedValue({
        bookmarks: mockBookmarks,
        total: 1,
      });

      const res = await app.request('/', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.bookmarks).toEqual(mockBookmarks);
      expect(body.total).toBe(1);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
    });

    it('should accept page and limit query parameters', async () => {
      const mockBookmarks = [{ id: '1', title: 'Test', url: 'https://test.com' }] as any;
      vi.mocked(bookmarkService.list).mockResolvedValue({
        bookmarks: mockBookmarks,
        total: 50,
      });

      const res = await app.request('/?page=2&limit=10', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      expect(bookmarkService.list).toHaveBeenCalledWith('user-123', 2, 10);
      const body = await res.json() as any;
      expect(body.page).toBe(2);
      expect(body.limit).toBe(10);
      expect(body.total).toBe(50);
    });
  });

  describe('POST /', () => {
    it('should create a bookmark', async () => {
      const input = { url: 'https://example.com', title: 'Example' };
      const created = { id: '1', ...input, userId: 'user-123' };
      vi.mocked(bookmarkService.create).mockResolvedValue(created as any);

      const res = await app.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body).toEqual(created);
    });

    it('should return 400 for invalid input', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'not-a-url' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /:id', () => {
    it('should return a bookmark', async () => {
      const bookmark = { id: '123e4567-e89b-12d3-a456-426614174000', title: 'Test' };
      vi.mocked(bookmarkService.get).mockResolvedValue(bookmark as any);

      const res = await app.request('/123e4567-e89b-12d3-a456-426614174000');

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body).toEqual(bookmark);
    });

    it('should return 404 if not found', async () => {
      vi.mocked(bookmarkService.get).mockResolvedValue(undefined as any);

      const res = await app.request('/123e4567-e89b-12d3-a456-426614174000');

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a bookmark', async () => {
      const update = { title: 'Updated' };
      const updated = { id: '123e4567-e89b-12d3-a456-426614174000', ...update };
      vi.mocked(bookmarkService.update).mockResolvedValue(updated as any);

      const res = await app.request('/123e4567-e89b-12d3-a456-426614174000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body).toEqual(updated);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a bookmark', async () => {
      const deleted = { id: '123e4567-e89b-12d3-a456-426614174000' };
      vi.mocked(bookmarkService.delete).mockResolvedValue(deleted as any);

      const res = await app.request('/123e4567-e89b-12d3-a456-426614174000', {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
    });
  });
});
