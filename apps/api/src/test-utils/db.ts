import { sql } from 'drizzle-orm';
import { db } from '../db';
import { bookmarks, users, sessions } from '../db/schema';
import type { User, Session } from '../lib/auth';
import type { Bookmark } from '../db/schema';

/**
 * Clean up test database by truncating all tables
 * Use this in beforeEach to ensure a clean state for each test
 */
export async function cleanDatabase() {
  await db.execute(sql`TRUNCATE TABLE bookmark_tags, bookmarks, tags, sessions, users CASCADE`);
}

/**
 * Create a test user in the database
 */
export async function createTestUser(overrides?: Partial<User>): Promise<User> {
  const now = new Date();
  const [user] = await db
    .insert(users)
    .values({
      id: overrides?.id || `test-user-${Date.now()}`,
      email: overrides?.email || `test-${Date.now()}@example.com`,
      name: overrides?.name || 'Test User',
      emailVerified: overrides?.emailVerified ?? false,
      image: overrides?.image ?? null,
      createdAt: overrides?.createdAt || now,
      updatedAt: overrides?.updatedAt || now,
    })
    .returning();
  return user!;
}

/**
 * Create a test session for a user
 */
export async function createTestSession(userId: string, overrides?: Partial<Session>): Promise<Session> {
  const now = new Date();
  const [session] = await db
    .insert(sessions)
    .values({
      id: overrides?.id || `test-session-${Date.now()}`,
      userId,
      token: overrides?.token || `test-token-${Date.now()}`,
      expiresAt: overrides?.expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 24),
      ipAddress: overrides?.ipAddress ?? null,
      userAgent: overrides?.userAgent ?? null,
      createdAt: overrides?.createdAt || now,
      updatedAt: overrides?.updatedAt || now,
    })
    .returning();
  return session!;
}

/**
 * Create a test bookmark in the database
 */
export async function createTestBookmark(
  userId: string,
  overrides?: Partial<Bookmark>
): Promise<Bookmark> {
  const now = new Date();
  const [bookmark] = await db
    .insert(bookmarks)
    .values({
      userId,
      url: overrides?.url || 'https://example.com',
      title: overrides?.title || 'Test Bookmark',
      content: overrides?.content ?? null,
      summary: overrides?.summary ?? null,
      ogImage: overrides?.ogImage ?? null,
      ogDescription: overrides?.ogDescription ?? null,
      status: overrides?.status,
      createdAt: overrides?.createdAt || now,
      updatedAt: overrides?.updatedAt || now,
    })
    .returning();
  return bookmark!;
}

/**
 * Create multiple test bookmarks at once
 */
export async function createTestBookmarks(
  userId: string,
  count: number,
  overrides?: (index: number) => Partial<Bookmark>
): Promise<Bookmark[]> {
  const promises = Array.from({ length: count }, (_, i) =>
    createTestBookmark(userId, overrides?.(i))
  );
  return await Promise.all(promises);
}
