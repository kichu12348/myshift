/**
 * Database schema for rotations.
 * Corresponds to domain Rotation type.
 * The repository is responsible for mapping to domain types and validating values.
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const rotations = sqliteTable('rotations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  anchorDate: text('anchor_date').notNull(),
  pattern: text('pattern', { mode: 'json' }).$type<Array<string | null>>().notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  active: integer('active', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at').notNull(),
});
