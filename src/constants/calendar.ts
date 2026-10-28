/**
 * English month names (index 0 = January ... index 11 = December).
 * Localization is out of scope for the MVP.
 */
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Three-letter weekday abbreviations indexed by DayOfWeek (0 = Sun ... 6 = Sat).
 * Localization is out of scope for the MVP.
 */
export const WEEKDAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Full English weekday names indexed by DayOfWeek (0 = Sunday ... 6 = Saturday).
 * Localization is out of scope for the MVP.
 */
export const WEEKDAY_FULL_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Maximum number of shift pills rendered inside a single month calendar cell.
 * Remaining shifts are represented via a +N overflow indicator.
 */
export const MAX_VISIBLE_SHIFT_PILLS = 2;
