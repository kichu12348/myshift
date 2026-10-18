import type { AppSettings } from './types/settings';
import { DEFAULT_REMINDER_PREFERENCES } from './reminders';

/**
 * Default global application settings.
 * remindersEnabled and defaultMinutesBefore are derived directly from DEFAULT_REMINDER_PREFERENCES.
 * Note: weekStart (1 = Monday) and timeFormat ("24h") defaults are user-configurable later in Settings.
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  remindersEnabled: DEFAULT_REMINDER_PREFERENCES.enabled,
  defaultMinutesBefore: [...DEFAULT_REMINDER_PREFERENCES.minutesBefore],
  themeMode: 'auto',
  weekStart: 1,
  timeFormat: '24h',
};
