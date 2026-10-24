export type ThemeModeSetting = 'auto' | 'light' | 'dark';
export type WeekStartSetting = 0 | 1;
export type TimeFormatSetting = '12h' | '24h';

/**
 * Domain representation of application settings and preferences.
 */
export interface AppSettings {
  readonly remindersEnabled: boolean;
  readonly defaultMinutesBefore: number[];
  readonly themeMode: ThemeModeSetting;
  readonly weekStart: WeekStartSetting;
  readonly timeFormat: TimeFormatSetting;
  readonly onboardingCompleted: boolean;
}

