import { bookmarkRepository } from './repository';
import { CreateBookmarkSchema, UpdateBookmarkSchema } from '@repo/types';
import type { BookmarkSortBy, BookmarkOrder } from '@repo/types';
import { z } from 'zod';
import { aiService } from '../ai';

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

  async summarize(id: string, userId: string) {
    const bookmark = await bookmarkRepository.findById(id);
    if (!bookmark || bookmark.userId !== userId) {
      return null;
    }

    // Fetch content from URL
    const content = await aiService.fetchWebContent(bookmark.url);

    // Generate summary using AI
    const summary = await aiService.generateSummary(content);

    // Update bookmark with summary
    return await bookmarkRepository.update(id, {
      summary,
      content,
      status: 'completed',
    });
  },

  async generateTags(id: string, userId: string) {
    const bookmark = await bookmarkRepository.findById(id);
    if (!bookmark || bookmark.userId !== userId) {
      return null;
    }

    let content = bookmark.content;
    if (!content) {
      content = await aiService.fetchWebContent(bookmark.url);
    }

    const generatedTagNames = await aiService.generateTags(content);

    return await bookmarkRepository.withTransaction(async (tx) => {
      if (!bookmark.content) {
        await bookmarkRepository.update(id, { content }, tx);
      }

      const savedTagsResults = await Promise.all(
        generatedTagNames.map((tagName) =>
          bookmarkRepository.findOrCreateTag(userId, tagName, tx)
        )
      );

      const savedTags = savedTagsResults.filter((tag): tag is NonNullable<typeof tag> => tag != null);

      await bookmarkRepository.addTagsToBookmark(
        id,
        savedTags.map((tag) => tag.id),
        tx
      );

      const updatedBookmark = await bookmarkRepository.findById(id, tx);
      if (!updatedBookmark) {
        return null;
      }

      return {
        bookmark: updatedBookmark,
        tags: savedTags.map((tag) => tag.name),
      };
    });
  },
};
