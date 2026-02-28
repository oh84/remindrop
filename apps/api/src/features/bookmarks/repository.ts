import { eq, desc, asc, count, ilike, or, and, gte, lt, inArray, type SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db } from '../../db';
import { bookmarks, tags, bookmarkTags, type Bookmark, type NewBookmark } from '../../db/schema';
import type { BookmarkSortBy, BookmarkOrder } from '@repo/types';
import type * as schema from '../../db/schema';

type DbClient = PostgresJsDatabase<typeof schema>;

export type Tag = typeof tags.$inferSelect;
export type BookmarkWithTags = Bookmark & { tags: Tag[] };

export interface FindManyOptions {
  limit: number;
  offset: number;
  sortBy?: BookmarkSortBy;
  order?: BookmarkOrder;
  query?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface CountOptions {
  query?: string;
  fromDate?: Date;
  toDate?: Date;
}

function buildFilterConditions(userId: string, options: CountOptions): SQL[] {
  const { query, fromDate, toDate } = options;
  const conditions: SQL[] = [eq(bookmarks.userId, userId)];

  if (query && query.trim()) {
    const searchPattern = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(bookmarks.title, searchPattern),
        ilike(bookmarks.url, searchPattern)
      )!
    );
  }

  if (fromDate) {
    conditions.push(gte(bookmarks.createdAt, fromDate));
  }

  if (toDate) {
    // toDateの終わりまで含めるため、翌日の0時未満（<）で比較
    const nextDay = new Date(toDate.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    conditions.push(lt(bookmarks.createdAt, nextDay));
  }

  return conditions;
}

export const bookmarkRepository = {
  async findManyByUserId(userId: string, options: FindManyOptions): Promise<BookmarkWithTags[]> {
    const { limit, offset, sortBy = 'createdAt', order = 'desc', query, fromDate, toDate } = options;

    const sortColumn = sortBy === 'updatedAt' ? bookmarks.updatedAt : bookmarks.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const conditions = buildFilterConditions(userId, { query, fromDate, toDate });

    const bookmarkList = await db
      .select()
      .from(bookmarks)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Fetch tags for all bookmarks in a single query
    if (bookmarkList.length === 0) {
      return [];
    }

    const bookmarkIds = bookmarkList.map((b) => b.id);
    const tagRelations = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
        tag: tags,
      })
      .from(bookmarkTags)
      .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(inArray(bookmarkTags.bookmarkId, bookmarkIds));

    // Group tags by bookmark ID
    const tagsByBookmarkId = new Map<string, Tag[]>();
    for (const { bookmarkId, tag } of tagRelations) {
      const existing = tagsByBookmarkId.get(bookmarkId) || [];
      existing.push(tag);
      tagsByBookmarkId.set(bookmarkId, existing);
    }

    // Combine bookmarks with their tags
    return bookmarkList.map((bookmark) => ({
      ...bookmark,
      tags: tagsByBookmarkId.get(bookmark.id) || [],
    }));
  },

  async countByUserId(userId: string, options: CountOptions = {}) {
    const conditions = buildFilterConditions(userId, options);

    const [result] = await db
      .select({ count: count() })
      .from(bookmarks)
      .where(and(...conditions));
    return result?.count ?? 0;
  },

  async findById(id: string, tx?: DbClient) {
    const client = tx ?? db;
    const [bookmark] = await client
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, id));
    return bookmark;
  },

  async create(data: NewBookmark) {
    const [bookmark] = await db.insert(bookmarks).values(data).returning();
    return bookmark;
  },

  async update(id: string, data: Partial<Bookmark>, tx?: DbClient) {
    const client = tx ?? db;
    const [bookmark] = await client
      .update(bookmarks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookmarks.id, id))
      .returning();
    return bookmark;
  },

  async delete(id: string) {
    const [bookmark] = await db
      .delete(bookmarks)
      .where(eq(bookmarks.id, id))
      .returning();
    return bookmark;
  },

  /**
   * Find an existing tag or create a new one. Uses insert-first strategy
   * with fallback SELECT only on unique constraint violations (PG 23505).
   */
  async findOrCreateTag(userId: string, tagName: string, tx?: DbClient): Promise<Tag | undefined> {
    const client = tx ?? db;
    try {
      const [newTag] = await client
        .insert(tags)
        .values({ userId, name: tagName })
        .returning();
      return newTag;
    } catch (error) {
      const isUniqueViolation =
        error instanceof Error && 'code' in error && (error as Record<string, unknown>).code === '23505';
      if (!isUniqueViolation) {
        throw error;
      }
      const [existingTag] = await client
        .select()
        .from(tags)
        .where(and(eq(tags.userId, userId), eq(tags.name, tagName)));
      return existingTag;
    }
  },

  async addTagsToBookmark(bookmarkId: string, tagIds: string[], tx?: DbClient) {
    const client = tx ?? db;

    await client.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, bookmarkId));

    const uniqueTagIds = [...new Set(tagIds)];
    if (uniqueTagIds.length === 0) return;

    await client.insert(bookmarkTags).values(
      uniqueTagIds.map((tagId) => ({ bookmarkId, tagId }))
    );
  },

  async getBookmarkTags(bookmarkId: string) {
    const result = await db
      .select({ tag: tags })
      .from(bookmarkTags)
      .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(eq(bookmarkTags.bookmarkId, bookmarkId));

    return result.map((r) => r.tag);
  },

  async withTransaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
    return db.transaction(fn);
  },
};
