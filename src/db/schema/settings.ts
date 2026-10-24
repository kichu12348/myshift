/**
 * Database schema for application settings and preferences (singleton row).
 * Corresponds to domain preferences / settings state.
 * The repository is responsible for initializing defaults and mapping values.
 */
import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable(
  'settings',
  {
    id: integer('id').primaryKey(),
    remindersEnabled: integer('reminders_enabled', { mode: 'boolean' }).notNull(),
    defaultMinutesBefore: text('default_minutes_before', {
      mode: 'json',
    })
      .$type<number[]>()
      .notNull(),
    themeMode: text('theme_mode', {
      enum: ['auto', 'light', 'dark'],
    }).notNull(),
    weekStart: integer('week_start').notNull(),
    timeFormat: text('time_format', {
      enum: ['12h', '24h'],
    }).notNull(),
  },
  (table) => [check('settings_id_check', sql`${table.id} = 1`)],
);
