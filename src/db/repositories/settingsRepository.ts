import { eq } from 'drizzle-orm';
import type {
  AppSettings,
  SettingsRepository,
  ThemeModeSetting,
  TimeFormatSetting,
  WeekStartSetting,
} from '@/domain';
import { DataIntegrityError } from '../errors';
import type { AppDatabase } from '../client';
import { settings } from '../schema';
import { validateEnumMember, validateNumberArray } from './validation';

type SettingsRow = typeof settings.$inferSelect;

const ALLOWED_THEME_MODES: readonly ThemeModeSetting[] = [
  'auto',
  'light',
  'dark',
] as const;

const ALLOWED_TIME_FORMATS: readonly TimeFormatSetting[] = [
  '12h',
  '24h',
] as const;

const SETTINGS_ROW_ID = 1;

export function mapRowToSettings(row: SettingsRow): AppSettings {
  const table = 'settings';
  const rowId = String(row.id);

  if (row.weekStart !== 0 && row.weekStart !== 1) {
    throw new DataIntegrityError(
      table,
      rowId,
      `Field 'weekStart' must be 0 or 1, got ${row.weekStart}`,
    );
  }

  const weekStart: WeekStartSetting = row.weekStart;

  return {
    remindersEnabled: row.remindersEnabled,
    defaultMinutesBefore: validateNumberArray(
      row.defaultMinutesBefore,
      table,
      rowId,
      'defaultMinutesBefore',
    ),
    themeMode: validateEnumMember(
      row.themeMode,
      ALLOWED_THEME_MODES,
      table,
      rowId,
      'themeMode',
    ),
    weekStart,
    timeFormat: validateEnumMember(
      row.timeFormat,
      ALLOWED_TIME_FORMATS,
      table,
      rowId,
      'timeFormat',
    ),
  };
}

export function createSettingsRepository(db: AppDatabase): SettingsRepository {
  return {
    async getOrCreate(defaults: AppSettings): Promise<AppSettings> {
      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ROW_ID))
        .limit(1);

      const existing = rows[0];
      if (existing !== undefined) {
        return mapRowToSettings(existing);
      }

      await db.insert(settings).values({
        id: SETTINGS_ROW_ID,
        remindersEnabled: defaults.remindersEnabled,
        defaultMinutesBefore: [...defaults.defaultMinutesBefore],
        themeMode: defaults.themeMode,
        weekStart: defaults.weekStart,
        timeFormat: defaults.timeFormat,
      });

      return defaults;
    },

    async update(newSettings: AppSettings): Promise<void> {
      const existing = await db
        .select({ id: settings.id })
        .from(settings)
        .where(eq(settings.id, SETTINGS_ROW_ID))
        .limit(1);

      if (existing[0] === undefined) {
        throw new Error(
          'Cannot update settings: settings singleton row does not exist',
        );
      }

      await db
        .update(settings)
        .set({
          remindersEnabled: newSettings.remindersEnabled,
          defaultMinutesBefore: [...newSettings.defaultMinutesBefore],
          themeMode: newSettings.themeMode,
          weekStart: newSettings.weekStart,
          timeFormat: newSettings.timeFormat,
        })
        .where(eq(settings.id, SETTINGS_ROW_ID));
    },
  };
}
