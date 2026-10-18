import { useEffect } from 'react';
import { selectThemeMode, useSettingsStore } from '@/store';
import { useTheme } from '@/theme';

/**
 * Synchronizes the ThemeProvider's mode with the user's settings stored in SQLite.
 *
 * The settings store is the single source of truth for the theme mode.
 * Components and screens never call setMode on the ThemeProvider directly;
 * they update the settings store, and this hook propagates the change.
 * When settings are not loaded yet (null), it does nothing.
 */
export function useSyncThemeMode(): void {
  const themeMode = useSettingsStore(selectThemeMode);
  const { setMode } = useTheme();

  useEffect(() => {
    if (themeMode !== null) {
      setMode(themeMode);
    }
  }, [themeMode, setMode]);
}
