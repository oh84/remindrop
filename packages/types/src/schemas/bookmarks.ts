import { z } from 'zod';
import { extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

const BookmarkStatusSchema = z.enum(['processing', 'completed', 'failed']);

export const BookmarkSchema = z.object({
  id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  userId: z.string().openapi({ example: 'user-123' }),
  url: z.string().url().openapi({ example: 'https://example.com' }),
  title: z.string().min(1).openapi({ example: 'Example Website' }),
  content: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
  ogDescription: z.string().nullable().optional(),
  status: BookmarkStatusSchema.openapi({ example: 'completed' }),
  createdAt: z.string().datetime().or(z.date()).openapi({ example: '2024-01-01T00:00:00.000Z' }),
  updatedAt: z.string().datetime().or(z.date()).openapi({ example: '2024-01-01T00:00:00.000Z' }),
});

export const CreateBookmarkSchema = z.object({
  url: z.string().url().openapi({ example: 'https://example.com' }),
  title: z.string().min(1).optional().openapi({ example: 'Example Website' }),
});

export const UpdateBookmarkSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  status: BookmarkStatusSchema.optional(),
});

export const BookmarkListSchema = z.object({
  bookmarks: z.array(BookmarkSchema),
  total: z.number().openapi({ example: 10 }),
  page: z.number().openapi({ example: 1 }),
  limit: z.number().openapi({ example: 20 }),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;
export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof UpdateBookmarkSchema>;
export type BookmarkStatus = z.infer<typeof BookmarkStatusSchema>;
