/**
 * Database schema for shift templates.
 * Corresponds to domain ShiftTemplate type.
 * The repository is responsible for mapping to domain types and validating values.
 */
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const shiftTemplates = sqliteTable('shift_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  breakMinutes: integer('break_minutes').notNull(),
  hourlyRate: real('hourly_rate'),
  isOff: integer('is_off', { mode: 'boolean' }).notNull(),
  reminderOverride: text('reminder_override', { mode: 'json' }).$type<number[]>(),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
});
