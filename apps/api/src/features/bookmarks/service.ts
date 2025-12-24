import { bookmarkRepository } from './repository';
import { CreateBookmarkSchema, UpdateBookmarkSchema } from '@repo/types';
import { z } from 'zod';

export const bookmarkService = {
  async list(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [bookmarks, total] = await Promise.all([
      bookmarkRepository.findManyByUserId(userId, limit, offset),
      bookmarkRepository.countByUserId(userId),
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
