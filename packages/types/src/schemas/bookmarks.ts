import { z } from 'zod';
import { extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

const BookmarkStatusSchema = z.enum(['processing', 'completed', 'failed']);

export const BookmarkSchema = z.object({
  id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  userId: z.string().openapi({ example: 'user-123' }),
  url: z.url().openapi({ example: 'https://example.com' }),
  title: z.string().min(1).openapi({ example: 'Example Website' }),
  content: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  ogImage: z.url().nullable().optional(),
  ogDescription: z.string().nullable().optional(),
  status: BookmarkStatusSchema.openapi({ example: 'completed' }),
  createdAt: z.iso.datetime().or(z.date()).openapi({ example: '2024-01-01T00:00:00.000Z' }),
  updatedAt: z.iso.datetime().or(z.date()).openapi({ example: '2024-01-01T00:00:00.000Z' }),
});

export const CreateBookmarkSchema = z.object({
  url: z.url().max(2048).openapi({ example: 'https://example.com' }), // 実用的な上限: RFC7230推奨8000文字、Safari視認性限界4096文字、実用推奨2000文字前後
  title: z.string().min(1).max(200).optional().openapi({ example: 'Example Website' }),
});

export const UpdateBookmarkSchema = z.object({
  url: z.url().max(2048).optional(), // 実用的な上限: RFC7230推奨8000文字、Safari視認性限界4096文字、実用推奨2000文字前後
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(50000).optional(), // 1ブックマークあたりの本文テキスト平均5KB（requirements.mdより）の10倍、十分な余裕
  summary: z.string().max(2000).optional(), // 3行要約としては十分、長めの要約でも対応可能
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
