import { MONTH_NAMES, WEEKDAY_FULL_NAMES } from '@/constants';
import { getDayOfWeek, parseLocalDate, type LocalDate } from '@/domain';

/**
 * Formats a LocalDate into a full human-readable string (e.g. "Tuesday, 20 October 2026").
 * Pure function used for accessibility labels and date headers.
 */
export function formatLongDate(date: LocalDate): string {
  const { year, month, day } = parseLocalDate(date);
  const dow = getDayOfWeek(date);
  const weekday = WEEKDAY_FULL_NAMES[dow] ?? '';
  const monthName = MONTH_NAMES[month - 1] ?? '';

  return `${weekday}, ${day} ${monthName} ${year}`;
}
