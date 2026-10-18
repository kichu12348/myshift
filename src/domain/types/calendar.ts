import type { LocalDate } from './dates';
import type { WeekStartSetting } from './settings';

/**
 * Day of the week indexed 0 = Sunday to 6 = Saturday (matching Date.getUTCDay).
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Week start configuration: 0 = Sunday, 1 = Monday.
 */
export type WeekStart = WeekStartSetting;

/**
 * Calendar year and month representation (month is 1 to 12).
 */
export interface YearMonth {
  readonly year: number;
  readonly month: number;
}

/**
 * A single cell in the calendar month grid.
 */
export interface CalendarDay {
  readonly date: LocalDate;
  readonly inMonth: boolean;
}
