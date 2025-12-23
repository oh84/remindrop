import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import { bookmarks, type Bookmark, type NewBookmark } from '../../db/schema';

export const bookmarkRepository = {
  async findManyByUserId(userId: string) {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
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
