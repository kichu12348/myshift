import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const monthlyFinanceConfigs = sqliteTable('monthly_finance_configs', {
  monthKey: text('month_key').primaryKey(),
  customStartDate: text('custom_start_date'),
  customEndDate: text('custom_end_date'),
  periodStartDate: text('period_start_date'),
  periodEndDate: text('period_end_date'),
  manualGrossOverride: real('manual_gross_override'),
  notes: text('notes').notNull().default(''),
});
