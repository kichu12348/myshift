export interface ColorTokens {
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly border: string;
  readonly text: string;
  readonly textMuted: string;
  readonly accent: string;
  readonly onAccent: string;
  readonly accentSoft: string;
  readonly danger: string;
  readonly weekendTint: string;
}

export const darkColors: ColorTokens = {
  background: '#101318',
  surface: '#181C23',
  surfaceRaised: '#1F242D',
  border: '#2A303B',
  text: '#DCE0E6',
  textMuted: '#8B93A1',
  accent: '#D498A0',
  onAccent: '#1A1114',
  accentSoft: 'rgba(212, 152, 160, 0.16)',
  danger: '#F87171',
  weekendTint: '#10131A',
};

export const lightColors: ColorTokens = {
  background: '#F4F3EF',
  surface: '#FBFAF8',
  surfaceRaised: '#FFFFFF',
  border: '#E4E2DC',
  text: '#1F2328',
  textMuted: '#6B7280',
  accent: '#A8505E',
  onAccent: '#FFFFFF',
  accentSoft: 'rgba(168, 80, 94, 0.12)',
  danger: '#DC2626',
  weekendTint: '#F1F1EE',
};
