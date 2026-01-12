import { eq, desc, asc, count, ilike, or, and, gte, lte, type SQL } from 'drizzle-orm';
import { db } from '../../db';
import { bookmarks, type Bookmark, type NewBookmark } from '../../db/schema';
import type { BookmarkSortBy, BookmarkOrder } from '@repo/types';

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
    // toDateの終わりまで含めるため、翌日の0時に設定
    const endOfDay = new Date(toDate);
    endOfDay.setDate(endOfDay.getDate() + 1);
    conditions.push(lte(bookmarks.createdAt, endOfDay));
  }

  return conditions;
}

export const bookmarkRepository = {
  async findManyByUserId(userId: string, options: FindManyOptions) {
    const { limit, offset, sortBy = 'createdAt', order = 'desc', query, fromDate, toDate } = options;

    const sortColumn = sortBy === 'updatedAt' ? bookmarks.updatedAt : bookmarks.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const conditions = buildFilterConditions(userId, { query, fromDate, toDate });

    return await db
      .select()
      .from(bookmarks)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);
  },

  async countByUserId(userId: string, options: CountOptions = {}) {
    const conditions = buildFilterConditions(userId, options);

    const [result] = await db
      .select({ count: count() })
      .from(bookmarks)
      .where(and(...conditions));
    return result?.count ?? 0;
  },

  async findById(id: string) {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, id));
    return bookmark;
  },

  async create(data: NewBookmark) {
    const [bookmark] = await db.insert(bookmarks).values(data).returning();
    return bookmark;
  },

  async update(id: string, data: Partial<Bookmark>) {
    const [bookmark] = await db
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
  }
};
