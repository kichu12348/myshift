import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const financeTemplates = sqliteTable('finance_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', {
    enum: ['tax', 'expense', 'remittance', 'savings'],
  }).notNull(),
  valueMode: text('value_mode', {
    enum: ['fixed', 'percentage'],
  }).notNull(),
  value: real('value').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  sortOrder: integer('sort_order').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});
