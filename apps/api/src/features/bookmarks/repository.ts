import { eq, desc, count } from 'drizzle-orm';
import { db } from '../../db';
import { bookmarks, type Bookmark, type NewBookmark } from '../../db/schema';

export const bookmarkRepository = {
  async findManyByUserId(userId: string, limit: number, offset: number) {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async countByUserId(userId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
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
