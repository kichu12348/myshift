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
    onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    hapticsEnabled: integer('haptics_enabled', { mode: 'boolean' }).notNull().default(true),
    payCycleConfigured: integer('pay_cycle_configured', { mode: 'boolean' })
      .notNull()
      .default(false),
    paydayDayOfMonth: integer('payday_day_of_month').notNull().default(25),
    anchorPaydayDate: text('anchor_payday_date').notNull().default(''),
    payCycleLengthUnit: text('pay_cycle_length_unit', {
      enum: ['financial-month', 'days'],
    })
      .notNull()
      .default('financial-month'),
    payCycleLengthDays: integer('pay_cycle_length_days').notNull().default(28),
  },
  (table) => [check('settings_id_check', sql`${table.id} = 1`)],
);
