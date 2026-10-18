/**
 * Database schema for stored shift instances.
 * Corresponds to domain Shift type.
 * The repository is responsible for mapping to domain types and validating values.
 */
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { shiftTemplates } from './shiftTemplates';
import { rotations } from './rotations';

export const shifts = sqliteTable(
  'shifts',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    templateId: text('template_id').references(() => shiftTemplates.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    isOff: integer('is_off', { mode: 'boolean' }).notNull(),
    startsAt: integer('starts_at').notNull(),
    endsAt: integer('ends_at').notNull(),
    breakMinutes: integer('break_minutes').notNull(),
    notes: text('notes').notNull(),
    source: text('source', {
      enum: ['manual', 'rotation_override'],
    }).notNull(),
    rotationId: text('rotation_id').references(() => rotations.id, {
      onDelete: 'set null',
    }),
    reminderOverride: text('reminder_override', { mode: 'json' }).$type<number[]>(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('shifts_date_idx').on(table.date),
    index('shifts_starts_at_idx').on(table.startsAt),
  ],
);
