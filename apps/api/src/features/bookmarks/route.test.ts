import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createMiddleware } from 'hono/factory';
import route from './route';
import { AuthVariables } from '../../middleware/auth';
import type { User, Session } from '../../lib/auth';
import { BookmarkListSchema, BookmarkSchema } from '@repo/types';
import {
  cleanDatabase,
  createTestUser,
  createTestSession,
  createTestBookmark,
  createTestBookmarks,
} from '../../test-utils/db';

describe('Bookmark Routes (Integration)', () => {
  let app: OpenAPIHono<{ Variables: AuthVariables }>;
  let user1: User;
  let user2: User;
  let session1: Session;
  let session2: Session;

  // Helper to create auth middleware for a specific user
  const createAuthMiddleware = (user: User, session: Session) =>
    createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
      c.set('user', user);
      c.set('session', session);
      await next();
    });

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase();

    // Create test users and sessions
    user1 = await createTestUser({ id: 'user-1', email: 'user1@example.com' });
    user2 = await createTestUser({ id: 'user-2', email: 'user2@example.com' });
    session1 = await createTestSession(user1.id, { id: 'session-1' });
    session2 = await createTestSession(user2.id, { id: 'session-2' });

    // Create app with user1 auth by default
    app = new OpenAPIHono<{ Variables: AuthVariables }>();
    app.use('*', createAuthMiddleware(user1, session1));
    app.route('/', route);
  });

  describe('GET /', () => {
    it('should return empty list when user has no bookmarks', async () => {
      const res = await app.request('/', { method: 'GET' });

      expect(res.status).toBe(200);
      const body = BookmarkListSchema.parse(await res.json());
      expect(body.bookmarks).toEqual([]);
      expect(body.total).toBe(0);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
    });

    it('should return list of bookmarks for authenticated user', async () => {
      // Create bookmarks for user1
      const bookmark1 = await createTestBookmark(user1.id, {
        title: 'Bookmark 1',
        url: 'https://example1.com',
      });
      const bookmark2 = await createTestBookmark(user1.id, {
        title: 'Bookmark 2',
        url: 'https://example2.com',
      });

      const res = await app.request('/', { method: 'GET' });

      expect(res.status).toBe(200);
      const body = BookmarkListSchema.parse(await res.json());
      expect(body.bookmarks).toHaveLength(2);
      expect(body.total).toBe(2);
      // Should be ordered by createdAt desc (newest first)
      expect(body.bookmarks[0]?.id).toBe(bookmark2.id);
      expect(body.bookmarks[1]?.id).toBe(bookmark1.id);
    });

    it('should only return bookmarks belonging to authenticated user', async () => {
      // Create bookmarks for both users
      await createTestBookmark(user1.id, { title: 'User1 Bookmark' });
      await createTestBookmark(user2.id, { title: 'User2 Bookmark' });

      const res = await app.request('/', { method: 'GET' });

      expect(res.status).toBe(200);
      const body = BookmarkListSchema.parse(await res.json());
      expect(body.bookmarks).toHaveLength(1);
      expect(body.bookmarks[0]?.title).toBe('User1 Bookmark');
    });

    it('should handle pagination with page and limit parameters', async () => {
      // Create 25 bookmarks
      await createTestBookmarks(user1.id, 25, (i) => ({
        title: `Bookmark ${i + 1}`,
        url: `https://example${i + 1}.com`,
      }));

      const res = await app.request('/?page=2&limit=10', { method: 'GET' });

      expect(res.status).toBe(200);
      const body = BookmarkListSchema.parse(await res.json());
      expect(body.bookmarks).toHaveLength(10);
      expect(body.total).toBe(25);
      expect(body.page).toBe(2);
      expect(body.limit).toBe(10);
    });

    it('should use default pagination values when not specified', async () => {
      const res = await app.request('/', { method: 'GET' });

      expect(res.status).toBe(200);
      const body = BookmarkListSchema.parse(await res.json());
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
    });

    it('should enforce maximum limit of 100', async () => {
      const res = await app.request('/?limit=200', { method: 'GET' });

      expect(res.status).toBe(400); // Should fail validation
    });

    it('should reject invalid page number', async () => {
      const res = await app.request('/?page=0', { method: 'GET' });

      expect(res.status).toBe(400); // Page must be >= 1
    });
  });

  describe('POST /', () => {
    it('should create a bookmark with title', async () => {
      const input = { url: 'https://example.com', title: 'My Bookmark' };

      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      expect(res.status).toBe(201);
      const body = BookmarkSchema.parse(await res.json());
      expect(body.url).toBe(input.url);
      expect(body.title).toBe(input.title);
      expect(body.userId).toBe(user1.id);
      expect(body.status).toBe('processing'); // Default status is 'processing'
    });

    it('should create bookmark with URL as title when title not provided', async () => {
      const input = { url: 'https://example.com' };

      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      expect(res.status).toBe(201);
      const body = BookmarkSchema.parse(await res.json());
      expect(body.title).toBe('https://example.com');
    });

    it('should return 400 for invalid URL', async () => {
      const input = { url: 'not-a-valid-url' };

      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing URL', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it('should reject title exceeding maximum length', async () => {
      const input = {
        url: 'https://example.com',
        title: 'a'.repeat(201), // Max is 200
      };

      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      expect(res.status).toBe(400);
    });

    it('should reject URL exceeding maximum length', async () => {
      const input = {
        url: 'https://example.com/' + 'a'.repeat(2049), // Max is 2048, so 2049 should fail
      };

      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /:id', () => {
    it('should return bookmark by ID', async () => {
      const bookmark = await createTestBookmark(user1.id, {
        title: 'Test Bookmark',
        url: 'https://example.com',
      });

      const res = await app.request(`/${bookmark.id}`, { method: 'GET' });

      expect(res.status).toBe(200);
      const body = BookmarkSchema.parse(await res.json());
      expect(body.id).toBe(bookmark.id);
      expect(body.title).toBe('Test Bookmark');
    });

    it('should return 404 when bookmark does not exist', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const res = await app.request(`/${fakeId}`, { method: 'GET' });

      expect(res.status).toBe(404);
    });

    it('should return 404 when accessing another user\'s bookmark (authorization)', async () => {
      // Create bookmark for user2
      const user2Bookmark = await createTestBookmark(user2.id, {
        title: 'User2 Bookmark',
      });

      // Try to access it as user1
      const res = await app.request(`/${user2Bookmark.id}`, { method: 'GET' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await app.request('/invalid-uuid', { method: 'GET' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /:id', () => {
    it('should update bookmark title', async () => {
      const bookmark = await createTestBookmark(user1.id, {
        title: 'Original Title',
        url: 'https://example.com',
      });

      const res = await app.request(`/${bookmark.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      expect(res.status).toBe(200);
      const body = BookmarkSchema.parse(await res.json());
      expect(body.title).toBe('Updated Title');
      expect(body.url).toBe('https://example.com'); // Should remain unchanged
    });

    it('should update multiple fields', async () => {
      const bookmark = await createTestBookmark(user1.id);

      const res = await app.request(`/${bookmark.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Title',
          summary: 'New Summary',
        }),
      });

      expect(res.status).toBe(200);
      const body = BookmarkSchema.parse(await res.json());
      expect(body.title).toBe('New Title');
      expect(body.summary).toBe('New Summary');
    });

    it('should return 404 when bookmark does not exist', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const res = await app.request(`/${fakeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      });

      expect(res.status).toBe(404);
    });

    it('should return 404 when updating another user\'s bookmark (authorization)', async () => {
      const user2Bookmark = await createTestBookmark(user2.id, {
        title: 'User2 Bookmark',
      });

      const res = await app.request(`/${user2Bookmark.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Hacked Title' }),
      });

      expect(res.status).toBe(404);

      // Verify bookmark was not modified
      const app2 = new OpenAPIHono<{ Variables: AuthVariables }>();
      app2.use('*', createAuthMiddleware(user2, session2));
      app2.route('/', route);

      const checkRes = await app2.request(`/${user2Bookmark.id}`, { method: 'GET' });
      const checkBody = BookmarkSchema.parse(await checkRes.json());
      expect(checkBody.title).toBe('User2 Bookmark'); // Should remain unchanged
    });

    it('should return 400 for invalid update data', async () => {
      const bookmark = await createTestBookmark(user1.id);

      const res = await app.request(`/${bookmark.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'invalid-url' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete bookmark', async () => {
      const bookmark = await createTestBookmark(user1.id, {
        title: 'To Delete',
      });

      const res = await app.request(`/${bookmark.id}`, { method: 'DELETE' });

      expect(res.status).toBe(200);
      const body = BookmarkSchema.parse(await res.json());
      expect(body.id).toBe(bookmark.id);

      // Verify it's actually deleted
      const getRes = await app.request(`/${bookmark.id}`, { method: 'GET' });
      expect(getRes.status).toBe(404);
    });

    it('should return 404 when bookmark does not exist', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const res = await app.request(`/${fakeId}`, { method: 'DELETE' });

      expect(res.status).toBe(404);
    });

    it('should return 404 when deleting another user\'s bookmark (authorization)', async () => {
      const user2Bookmark = await createTestBookmark(user2.id, {
        title: 'User2 Bookmark',
      });

      const res = await app.request(`/${user2Bookmark.id}`, { method: 'DELETE' });

      expect(res.status).toBe(404);

      // Verify bookmark still exists
      const app2 = new OpenAPIHono<{ Variables: AuthVariables }>();
      app2.use('*', createAuthMiddleware(user2, session2));
      app2.route('/', route);

      const checkRes = await app2.request(`/${user2Bookmark.id}`, { method: 'GET' });
      expect(checkRes.status).toBe(200);
    });
  });
});
