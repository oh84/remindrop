import { bookmarkRepository } from './repository';
import { CreateBookmarkSchema, UpdateBookmarkSchema } from '@repo/types';
import type { BookmarkSortBy, BookmarkOrder } from '@repo/types';
import { z } from 'zod';

export interface ListOptions {
  page: number;
  limit: number;
  sortBy?: BookmarkSortBy;
  order?: BookmarkOrder;
  query?: string;
  fromDate?: Date;
  toDate?: Date;
}

export const bookmarkService = {
  async list(userId: string, options: ListOptions) {
    const { page, limit, sortBy, order, query, fromDate, toDate } = options;
    const offset = (page - 1) * limit;
    const [bookmarks, total] = await Promise.all([
      bookmarkRepository.findManyByUserId(userId, { limit, offset, sortBy, order, query, fromDate, toDate }),
      bookmarkRepository.countByUserId(userId, { query, fromDate, toDate }),
    ]);
    return { bookmarks, total };
  },

  async get(id: string, userId: string) {
    const bookmark = await bookmarkRepository.findById(id);
    if (!bookmark || bookmark.userId !== userId) {
      return null;
    }
    return bookmark;
  },

  async create(userId: string, data: z.infer<typeof CreateBookmarkSchema>) {
    return await bookmarkRepository.create({
      ...data,
      userId,
      title: data.title || data.url, // Default title to URL if empty
    });
  },

  async update(id: string, userId: string, data: z.infer<typeof UpdateBookmarkSchema>) {
    const bookmark = await bookmarkRepository.findById(id);
    if (!bookmark || bookmark.userId !== userId) {
      return null;
    }
    return await bookmarkRepository.update(id, data);
  },

  async delete(id: string, userId: string) {
    const bookmark = await bookmarkRepository.findById(id);
    if (!bookmark || bookmark.userId !== userId) {
      return null;
    }
    return await bookmarkRepository.delete(id);
  },
};
