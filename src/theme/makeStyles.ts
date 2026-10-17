import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import type { Theme } from './theme';

type StyleProp = ViewStyle | TextStyle | ImageStyle;

export function makeStyles<T extends Record<string, StyleProp>>(
  factory: (theme: Theme) => T,
): () => T {
  return function useStyles(): T {
    const { theme } = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
