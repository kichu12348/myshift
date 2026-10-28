import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, type ThemeSetting } from '@/theme';

export interface RenderWithProvidersOptions {
  readonly theme?: ThemeSetting;
}

/**
 * Shared test renderer that wraps tested components with SafeAreaProvider and ThemeProvider.
 */
export async function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions,
): Promise<RenderResult> {
  return await render(
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <ThemeProvider initialMode={options?.theme ?? 'dark'}>{ui}</ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>,
  );
}
