/**
 * Database schema for scheduled OS notification records.
 * Corresponds to domain DesiredReminder records.
 * Note: shiftKey is not a foreign key because it can refer to virtual rotation shift IDs.
 * The repository is responsible for mapping and managing scheduled reminder records.
 */
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const scheduledReminders = sqliteTable(
  'scheduled_reminders',
  {
    id: text('id').primaryKey(),
    shiftKey: text('shift_key').notNull(),
    offsetMinutes: integer('offset_minutes').notNull(),
    notificationId: text('notification_id').notNull(),
    fireAt: integer('fire_at').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('scheduled_reminders_shift_key_offset_minutes_idx').on(
      table.shiftKey,
      table.offsetMinutes,
    ),
    index('scheduled_reminders_fire_at_idx').on(table.fireAt),
  ],
);
