// User settings schema
import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userSettings = pgTable(
  'user_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    dailySummaryTime: text('daily_summary_time').notNull().default('21:00'),
    summaryLength: integer('summary_length').notNull().default(3),
    notificationEmail: text('notification_email'),
    timezone: text('timezone').notNull().default('Asia/Tokyo'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('user_settings_user_id_idx').on(table.userId),
  })
);
