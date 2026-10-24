import { MONTH_NAMES, WEEKDAY_FULL_NAMES } from '@/constants';
import {
  epochToTimeOfDay,
  formatTimeOfDay,
  getDayOfWeek,
  parseLocalDate,
  toLocalDate,
  type LocalDate,
  type TimeFormatSetting,
} from '@/domain';

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

/**
 * Formats a shift's start and end timestamps into a human-readable time range.
 * Returns "All day" for Off shifts, or formatted times (e.g. "07:00 – 19:00", with " (+1d)" if overnight).
 */
export function formatShiftTimeRange(
  startsAt: number,
  endsAt: number,
  isOff: boolean,
  timeFormat: TimeFormatSetting,
): string {
  if (isOff) {
    return 'All day';
  }

  const startTime = epochToTimeOfDay(startsAt);
  const endTime = epochToTimeOfDay(endsAt);
  const startFormatted = formatTimeOfDay(startTime, timeFormat);
  const endFormatted = formatTimeOfDay(endTime, timeFormat);

  const startDate = toLocalDate(new Date(startsAt));
  const endDate = toLocalDate(new Date(endsAt));
  const isOvernight = startDate !== endDate;
  const suffix = isOvernight ? ' (+1d)' : '';

  return `${startFormatted} \u2013 ${endFormatted}${suffix}`;
}

/**
 * Formats a week date range into a compact string.
 * Examples:
 * - Same month: "19 – 25 Oct 2026"
 * - Crossing months: "28 Sep – 4 Oct 2026"
 * - Crossing years: "28 Dec 2026 – 3 Jan 2027"
 */
export function formatWeekRange(from: LocalDate, to: LocalDate): string {
  const { year: y1, month: m1, day: d1 } = parseLocalDate(from);
  const { year: y2, month: m2, day: d2 } = parseLocalDate(to);

  const month1 = (MONTH_NAMES[m1 - 1] ?? '').slice(0, 3);
  const month2 = (MONTH_NAMES[m2 - 1] ?? '').slice(0, 3);

  if (y1 === y2) {
    if (m1 === m2) {
      return `${d1} \u2013 ${d2} ${month1} ${y1}`;
    }
    return `${d1} ${month1} \u2013 ${d2} ${month2} ${y1}`;
  }

  return `${d1} ${month1} ${y1} \u2013 ${d2} ${month2} ${y2}`;
}
