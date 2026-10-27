import type { ThemeMode } from './theme';

export type ShiftColorName =
  'Amber' | 'Orange' | 'Red' | 'Steel blue' | 'Sky' | 'Green' | 'Lime' | 'Brown' | 'Slate';

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

export const DEFAULT_SHIFT_COLOR = '#F59E0B';
export const DEFAULT_NIGHT_COLOR = '#5B7DB1';
export const DEFAULT_OFF_COLOR = '#94A3B8';

/**
 * Alpha hex suffix (~18% opacity) applied to shift colors for tint background fills.
 */
export const SHIFT_PILL_FILL_ALPHA = '2E';

const PRESET_ALIASES: Readonly<Record<string, ShiftColorName>> = {
  amber: 'Amber',
  orange: 'Orange',
  red: 'Red',
  'steel blue': 'Steel blue',
  steelblue: 'Steel blue',
  'steel-blue': 'Steel blue',
  steel_blue: 'Steel blue',
  blue: 'Steel blue',
  sky: 'Sky',
  'sky blue': 'Sky',
  skyblue: 'Sky',
  cyan: 'Sky',
  green: 'Green',
  emerald: 'Green',
  lime: 'Lime',
  brown: 'Brown',
  slate: 'Slate',
  gray: 'Slate',
  grey: 'Slate',
};

/**
 * Resolves a shift color for the active theme mode.
 * - Named presets (e.g. 'amber', 'blue', 'slate', 'emerald') resolve to preset hex values.
 * - In dark mode, stored preset light colors map to their softer dark counterpart.
 * - Custom hex colors remain unchanged in both light and dark mode.
 */
export function resolveShiftColor(color: string, mode: ThemeMode): string {
  if (!color || typeof color !== 'string') {
    return mode === 'dark' ? '#D9A441' : '#F59E0B';
  }

  const trimmed = color.trim();
  const normalized = trimmed.toLowerCase();

  // 1. Check named preset aliases (e.g., 'blue', 'emerald', 'amber', 'slate')
  const aliasMatch = PRESET_ALIASES[normalized];
  if (aliasMatch !== undefined) {
    const preset = shiftColorPresets.find((p) => p.name === aliasMatch);
    if (preset !== undefined) {
      return mode === 'dark' ? preset.dark : preset.light;
    }
  }

  // 2. Check direct preset name match (e.g., 'Amber', 'Steel blue')
  const directNameMatch = shiftColorPresets.find((p) => p.name.toLowerCase() === normalized);
  if (directNameMatch !== undefined) {
    return mode === 'dark' ? directNameMatch.dark : directNameMatch.light;
  }

  // 3. Check hex matching against presets
  const hexValue =
    !trimmed.startsWith('#') && /^[0-9A-Fa-f]{3,8}$/.test(trimmed) ? `#${trimmed}` : trimmed;
  const hexNormalized = hexValue.toLowerCase();

  if (mode === 'dark') {
    const matched = shiftColorPresets.find(
      (preset) =>
        preset.light.toLowerCase() === hexNormalized || preset.dark.toLowerCase() === hexNormalized,
    );
    if (matched !== undefined) {
      return matched.dark;
    }
  } else {
    const matched = shiftColorPresets.find(
      (preset) => preset.dark.toLowerCase() === hexNormalized,
    );
    if (matched !== undefined) {
      return matched.light;
    }
  }

  return hexValue;
}
