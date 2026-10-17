import { darkColors, lightColors, type ColorTokens } from './colors';
import { radius, type RadiusTokens } from './radius';
import { spacing, type SpacingTokens } from './spacing';
import { typography, type TypographyTokens } from './typography';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  readonly mode: ThemeMode;
  readonly colors: ColorTokens;
  readonly spacing: SpacingTokens;
  readonly radius: RadiusTokens;
  readonly typography: TypographyTokens;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  radius,
  typography,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  radius,
  typography,
};
