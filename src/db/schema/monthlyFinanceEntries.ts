import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const monthlyFinanceEntries = sqliteTable(
  'monthly_finance_entries',
  {
    id: text('id').primaryKey(),
    monthKey: text('month_key').notNull(),
    templateId: text('template_id'),
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
    isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [index('monthly_finance_entries_month_key_idx').on(table.monthKey)],
);
