import type { FeatherIconName } from '@react-native-vector-icons/feather';

/**
 * Curated list of 16 Feather icon names for shift representations.
 * Checked at compile time against @react-native-vector-icons/feather via satisfies.
 */
export const SHIFT_ICONS = [
  'sun',
  'moon',
  'sunrise',
  'sunset',
  'coffee',
  'home',
  'activity',
  'heart',
  'briefcase',
  'truck',
  'clock',
  'star',
  'zap',
  'cloud',
  'flag',
  'bell',
] as const satisfies readonly FeatherIconName[];

export type ShiftIconName = (typeof SHIFT_ICONS)[number];

export const DEFAULT_SHIFT_ICON: ShiftIconName = 'clock';

/**
 * Type guard verifying whether a string matches one of the curated shift icon names.
 */
export function isShiftIconName(value: string): value is ShiftIconName {
  return (SHIFT_ICONS as readonly string[]).includes(value);
}
