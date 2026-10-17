export type ShiftColorName =
  | 'Amber'
  | 'Orange'
  | 'Red'
  | 'Steel blue'
  | 'Sky'
  | 'Green'
  | 'Lime'
  | 'Brown'
  | 'Slate';

export interface ShiftColorPreset {
  readonly name: ShiftColorName;
  readonly light: string;
  readonly dark: string;
}

export const shiftColorPresets: readonly ShiftColorPreset[] = [
  { name: 'Amber', light: '#F59E0B', dark: '#D9A441' },
  { name: 'Orange', light: '#F97316', dark: '#D98655' },
  { name: 'Red', light: '#EF4444', dark: '#D9706E' },
  { name: 'Steel blue', light: '#5B7DB1', dark: '#7F9CC8' },
  { name: 'Sky', light: '#0EA5E9', dark: '#6CB4D6' },
  { name: 'Green', light: '#10B981', dark: '#6FB394' },
  { name: 'Lime', light: '#84CC16', dark: '#A3BF6B' },
  { name: 'Brown', light: '#A16207', dark: '#B08A5A' },
  { name: 'Slate', light: '#94A3B8', dark: '#8D98A8' },
] as const;
