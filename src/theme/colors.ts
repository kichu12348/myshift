export interface ColorTokens {
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly onAccent: string;
  readonly accentSoft: string;
  readonly dangerSoft: string;
  readonly error: string;
  readonly danger: string;
  readonly warning: string;
  readonly success: string;
  readonly info: string;
  readonly border: string;
  readonly shadow: string;
  readonly overlay: string;
  readonly weekendTint: string;
}

export const lightColors: ColorTokens = {
  background: '#f8f5f2',
  surface: '#ffffff',
  surfaceRaised: '#ffffff',
  text: '#3d405b',
  textSecondary: '#8d99ae',
  textMuted: '#8d99ae',
  primary: '#5d8bf4',
  secondary: '#8a70d6',
  accent: '#5d8bf4',
  onAccent: '#ffffff',
  accentSoft: '#5d8bf412',
  dangerSoft: '#e5737314',
  error: '#e57373',
  danger: '#e57373',
  warning: '#f4b740',
  success: '#34d399',
  info: '#5d8bf4',
  border: '#e2e2e2',
  shadow: '#00000010',
  overlay: '#00000080',
  weekendTint: '#f2ede8',
};

export const darkColors: ColorTokens = {
  background: '#0f1117',
  surface: '#181b24',
  surfaceRaised: '#202430',
  text: '#f8f9fa',
  textSecondary: '#b0b7c3',
  textMuted: '#b0b7c3',
  primary: '#6ea8fe',
  secondary: '#a58cff',
  accent: '#6ea8fe',
  onAccent: '#0f1117',
  accentSoft: '#6ea8fe16',
  dangerSoft: '#ef535018',
  error: '#ef5350',
  danger: '#ef5350',
  warning: '#f4c04e',
  success: '#3ddc97',
  info: '#6ea8fe',
  border: '#2a2d36',
  shadow: '#00000090',
  overlay: '#000000B3',
  weekendTint: '#13161f',
};
