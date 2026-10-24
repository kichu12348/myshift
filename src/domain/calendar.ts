import type { CalendarDay, DayOfWeek, LocalDate, WeekStart, YearMonth } from './types';
import { addDays, formatLocalDate, getDayOfWeek, parseLocalDate } from './dates';

/**
 * Standard number of rows in the month calendar grid.
 * Fixed to 6 rows to ensure consistent vertical layout height.
 */
export const CALENDAR_GRID_ROWS = 6;

/**
 * Number of days in a calendar week.
 */
export const DAYS_PER_WEEK = 7;

/**
 * Extracts the YearMonth component from a LocalDate.
 */
export function getYearMonth(date: LocalDate): YearMonth {
  const { year, month } = parseLocalDate(date);
  return { year, month };
}

/**
 * Adds a positive or negative number of months to a YearMonth, crossing year boundaries cleanly.
 */
export function addMonths(yearMonth: YearMonth, delta: number): YearMonth {
  const totalMonths = yearMonth.year * 12 + (yearMonth.month - 1) + delta;
  const year = Math.floor(totalMonths / 12);
  const month = (((totalMonths % 12) + 12) % 12) + 1;
  return { year, month };
}

/**
 * Returns the first day of the specified YearMonth as a LocalDate (YYYY-MM-01).
 */
export function getMonthStartDate(yearMonth: YearMonth): LocalDate {
  return formatLocalDate(yearMonth.year, yearMonth.month, 1);
}

/**
 * Returns the last day of the specified YearMonth as a LocalDate, correctly handling leap years.
 */
export function getMonthEndDate(yearMonth: YearMonth): LocalDate {
  // Day 0 of month M (with M 1-indexed) in Date.UTC returns the last day of month M
  const utcDate = new Date(Date.UTC(yearMonth.year, yearMonth.month, 0));
  const lastDay = utcDate.getUTCDate();
  return formatLocalDate(yearMonth.year, yearMonth.month, lastDay);
}

/**
 * Returns the inclusive date range for an entire month.
 */
export function getMonthDateRange(yearMonth: YearMonth): {
  readonly from: LocalDate;
  readonly to: LocalDate;
} {
  return {
    from: getMonthStartDate(yearMonth),
    to: getMonthEndDate(yearMonth),
  };
}

/**
 * Returns the 7 days of the week in order starting from weekStart (0 = Sunday, 1 = Monday).
 */
export function getWeekdayOrder(weekStart: WeekStart): ReadonlyArray<DayOfWeek> {
  if (weekStart === 1) {
    return [1, 2, 3, 4, 5, 6, 0];
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

/**
 * Checks whether a given DayOfWeek is on the weekend (Saturday or Sunday).
 */
export function isWeekendDay(dayOfWeek: DayOfWeek): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Computes an immutable 6x7 grid of CalendarDay items for a given YearMonth and WeekStart.
 * Guarantees exactly 6 rows of 7 consecutive dates, starting on the chosen weekStart day.
 * Always returns new independent array instances.
 */
export function getMonthGrid(
  yearMonth: YearMonth,
  weekStart: WeekStart,
): ReadonlyArray<ReadonlyArray<CalendarDay>> {
  const startDate = getMonthStartDate(yearMonth);
  const firstDayOfWeek = getDayOfWeek(startDate);
  const offset = (((firstDayOfWeek - weekStart) % 7) + 7) % 7;
  const firstGridDate = addDays(startDate, -offset);

  const grid: CalendarDay[][] = [];

  for (let row = 0; row < CALENDAR_GRID_ROWS; row += 1) {
    const rowDays: CalendarDay[] = [];
    for (let col = 0; col < DAYS_PER_WEEK; col += 1) {
      const dayIndex = row * DAYS_PER_WEEK + col;
      const cellDate = addDays(firstGridDate, dayIndex);
      const { year, month } = parseLocalDate(cellDate);
      const inMonth = year === yearMonth.year && month === yearMonth.month;
      rowDays.push({ date: cellDate, inMonth });
    }
    grid.push(rowDays);
  }

  return grid;
}

/**
 * Returns the first and last dates of the 6x7 month grid.
 * Used by calendar screens to query the exact shift date range needed for display.
 */
export function getGridDateRange(
  yearMonth: YearMonth,
  weekStart: WeekStart,
): {
  readonly from: LocalDate;
  readonly to: LocalDate;
} {
  const startDate = getMonthStartDate(yearMonth);
  const firstDayOfWeek = getDayOfWeek(startDate);
  const offset = (((firstDayOfWeek - weekStart) % 7) + 7) % 7;
  const firstGridDate = addDays(startDate, -offset);
  const lastCellIndex = CALENDAR_GRID_ROWS * DAYS_PER_WEEK - 1;
  const lastGridDate = addDays(firstGridDate, lastCellIndex);

  return {
    from: firstGridDate,
    to: lastGridDate,
  };
}
