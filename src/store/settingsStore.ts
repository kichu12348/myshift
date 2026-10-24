import { create } from 'zustand';
import type { AppSettings, ThemeModeSetting } from '@/domain';
import { DEFAULT_APP_SETTINGS, normalizeOffsets } from '@/domain';
import { repositories } from '@/db';
import { createLogger, requestReminderSync } from '@/services';
import type { StoreStatus } from './types';

const logger = createLogger('store:settings');

export interface SettingsState {
  readonly settings: AppSettings | null;
  readonly status: StoreStatus;
  readonly error: string | null;
  readonly loadSettings: () => Promise<void>;
  readonly updateSettings: (changes: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: null,
  status: 'idle',
  error: null,

  async loadSettings(): Promise<void> {
    set({ status: 'loading', error: null });
    try {
      const loaded = await repositories.settings.getOrCreate(DEFAULT_APP_SETTINGS);
      set({ settings: loaded, status: 'ready', error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load app settings';
      logger.error('Failed to load settings', err);
      set({ status: 'error', error: message });
    }
  },

  async updateSettings(changes: Partial<AppSettings>): Promise<void> {
    if (changes.themeMode !== undefined) {
      if (
        changes.themeMode !== 'auto' &&
        changes.themeMode !== 'light' &&
        changes.themeMode !== 'dark'
      ) {
        throw new Error(`Invalid themeMode: ${String(changes.themeMode)}`);
      }
    }

    if (changes.weekStart !== undefined) {
      if (changes.weekStart !== 0 && changes.weekStart !== 1) {
        throw new Error(`Invalid weekStart: ${String(changes.weekStart)}. Must be 0 or 1`);
      }
    }

    if (changes.timeFormat !== undefined) {
      if (changes.timeFormat !== '12h' && changes.timeFormat !== '24h') {
        throw new Error(`Invalid timeFormat: ${String(changes.timeFormat)}. Must be 12h or 24h`);
      }
    }

    if (changes.remindersEnabled !== undefined) {
      if (typeof changes.remindersEnabled !== 'boolean') {
        throw new Error('Invalid remindersEnabled setting');
      }
    }

    const current =
      get().settings ?? (await repositories.settings.getOrCreate(DEFAULT_APP_SETTINGS));

    const updated: AppSettings = {
      remindersEnabled: changes.remindersEnabled ?? current.remindersEnabled,
      defaultMinutesBefore:
        changes.defaultMinutesBefore !== undefined
          ? normalizeOffsets(changes.defaultMinutesBefore)
          : current.defaultMinutesBefore,
      themeMode: changes.themeMode ?? current.themeMode,
      weekStart: changes.weekStart ?? current.weekStart,
      timeFormat: changes.timeFormat ?? current.timeFormat,
    };

    try {
      await repositories.settings.update(updated);
    } catch (err: unknown) {
      logger.error('Failed to update app settings', err);
      throw err;
    }

    set({ settings: updated, status: 'ready', error: null });
    void requestReminderSync();
  },
}));

export const selectSettings = (state: SettingsState): AppSettings | null => state.settings;
export const selectThemeMode = (state: SettingsState): ThemeModeSetting | null =>
  state.settings?.themeMode ?? null;
export const selectSettingsStatus = (state: SettingsState): StoreStatus => state.status;
export const selectSettingsError = (state: SettingsState): string | null => state.error;
