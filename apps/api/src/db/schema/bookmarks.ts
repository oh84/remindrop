// Bookmark schema
import { pgTable, uuid, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const bookmarkStatusEnum = pgEnum('bookmark_status', [
  'processing',
  'completed',
  'failed',
]);

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    summary: text('summary'),
    ogImage: text('og_image'),
    ogDescription: text('og_description'),
    status: bookmarkStatusEnum('status').notNull().default('processing'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('bookmarks_user_id_idx').on(table.userId),
    index('bookmarks_user_id_created_at_idx').on(table.userId, table.createdAt),
    index('bookmarks_status_idx').on(table.status),
  ]
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('tags_user_id_idx').on(table.userId),
    index('tags_user_id_name_idx').on(table.userId, table.name),
  ]
);

export const bookmarkTags = pgTable(
  'bookmark_tags',
  {
    bookmarkId: uuid('bookmark_id')
      .notNull()
      .references(() => bookmarks.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('bookmark_tags_bookmark_id_idx').on(table.bookmarkId),
    index('bookmark_tags_tag_id_idx').on(table.tagId),
  ]
);
