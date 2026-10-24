/**
 * Database schema for rotation exceptions (per-day modifications).
 * Corresponds to domain RotationException type.
 * The repository is responsible for mapping to domain types and validating values.
 */
import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { rotations } from './rotations';
import { shiftTemplates } from './shiftTemplates';

export const rotationExceptions = sqliteTable(
  'rotation_exceptions',
  {
    rotationId: text('rotation_id')
      .notNull()
      .references(() => rotations.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    kind: text('kind', { enum: ['skip', 'replace'] }).notNull(),
    templateId: text('template_id').references(() => shiftTemplates.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [primaryKey({ columns: [table.rotationId, table.date] })],
);
