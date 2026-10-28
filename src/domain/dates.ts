import type { LocalDate, TimeOfDay } from './types/dates';
import type { DayOfWeek } from './types/calendar';
import type { TimeFormatSetting } from './types/settings';

/**
 * Validates whether a given string is a real calendar date in YYYY-MM-DD format.
 * Correctly accounts for days per month and leap years.
 */
export function isLocalDate(value: string): value is LocalDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const yearStr = match[1];
  const monthStr = match[2];
  const dayStr = match[3];
  if (!yearStr || !monthStr || !dayStr) {
    return false;
  }

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) {
    return false;
  }

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const maxDays = daysInMonth[month - 1];
  if (maxDays === undefined || day < 1 || day > maxDays) {
    return false;
  }

  return true;
}

/**
 * Validates whether a given string is a 24-hour time of day between 00:00 and 23:59.
 */
export function isTimeOfDay(value: string): value is TimeOfDay {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const hoursStr = match[1];
  const minutesStr = match[2];
  if (!hoursStr || !minutesStr) {
    return false;
  }

  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Extracts year, month (1-12), and day components from a LocalDate.
 */
export function parseLocalDate(date: LocalDate): {
  year: number;
  month: number;
  day: number;
} {
  const parts = date.split('-');
  const yearStr = parts[0];
  const monthStr = parts[1];
  const dayStr = parts[2];

  return {
    year: yearStr !== undefined ? Number(yearStr) : 0,
    month: monthStr !== undefined ? Number(monthStr) : 0,
    day: dayStr !== undefined ? Number(dayStr) : 0,
  };
}

/**
 * Calculates the day of the week for a given LocalDate (0 = Sunday ... 6 = Saturday).
 * Computed strictly with UTC arithmetic to avoid local DST shifts.
 */
export function getDayOfWeek(date: LocalDate): DayOfWeek {
  const { year, month, day } = parseLocalDate(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return utcDate.getUTCDay() as DayOfWeek;
}

/**
 * Parses hours and minutes from a TimeOfDay.
 */
export function parseTimeOfDay(time: TimeOfDay): {
  hours: number;
  minutes: number;
} {
  const parts = time.split(':');
  const hoursStr = parts[0];
  const minutesStr = parts[1];

  return {
    hours: hoursStr !== undefined ? Number(hoursStr) : 0,
    minutes: minutesStr !== undefined ? Number(minutesStr) : 0,
  };
}

/**
 * Converts a TimeOfDay string to total minutes since midnight (0 - 1439).
 */
export function timeOfDayToMinutes(time: TimeOfDay): number {
  const { hours, minutes } = parseTimeOfDay(time);
  return hours * 60 + minutes;
}

/**
 * Formats numeric year, month, and day components into a validated LocalDate.
 */
export function formatLocalDate(year: number, month: number, day: number): LocalDate {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  const formatted = `${y}-${m}-${d}`;

  if (!isLocalDate(formatted)) {
    throw new Error(`Invalid local date values: ${year}-${month}-${day}`);
  }

  return formatted;
}

/**
 * Adds a signed number of days to a LocalDate using UTC arithmetic to avoid DST distortion.
 */
export function addDays(date: LocalDate, days: number): LocalDate {
  const { year, month, day } = parseLocalDate(date);
  const targetUtc = Date.UTC(year, month - 1, day + days);
  const targetDate = new Date(targetUtc);

  return formatLocalDate(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth() + 1,
    targetDate.getUTCDate(),
  );
}

/**
 * Calculates the signed number of days between two dates (to minus from).
 */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const fromParts = parseLocalDate(from);
  const toParts = parseLocalDate(to);

  const fromUtc = Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day);
  const toUtc = Date.UTC(toParts.year, toParts.month - 1, toParts.day);

  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/**
 * Compares two LocalDates lexicographically. Returns -1 if a < b, 1 if a > b, 0 if equal.
 */
export function compareLocalDates(a: LocalDate, b: LocalDate): -1 | 0 | 1 {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

/**
 * Converts a standard Date object into a LocalDate based on local device calendar components.
 */
export function toLocalDate(date: Date): LocalDate {
  return formatLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Calculates local start and end timestamps and the resulting end calendar date for a shift.
 *
 * Rules:
 * - If endTime > startTime, the shift finishes on the same calendar day.
 * - If endTime <= startTime, the shift is overnight and finishes on the following day.
 * - When startTime === endTime, it represents a full 24-hour shift ending on the next day.
 *
 * DST Transitions:
 * Local wall-clock times are converted to epoch milliseconds with the local Date constructor.
 * Across Daylight Saving Time transitions:
 * - Spring forward (gap): JS engines push the wall-clock time forward into standard time.
 * - Fall back (repeated hour): JS engines resolve to the first matching timestamp.
 * We deliberately accept standard ECMAScript behavior so shift start/end labels always
 * mirror the intended wall-clock hours.
 */
export function getShiftTimes(
  date: LocalDate,
  startTime: TimeOfDay,
  endTime: TimeOfDay,
): {
  startsAt: number;
  endsAt: number;
  endDate: LocalDate;
} {
  const { year, month, day } = parseLocalDate(date);
  const startMinutes = timeOfDayToMinutes(startTime);
  const endMinutes = timeOfDayToMinutes(endTime);

  const isOvernight = endMinutes <= startMinutes;
  const endDate = isOvernight ? addDays(date, 1) : date;
  const endParts = parseLocalDate(endDate);

  const { hours: startH, minutes: startM } = parseTimeOfDay(startTime);
  const { hours: endH, minutes: endM } = parseTimeOfDay(endTime);

  const startsAt = new Date(year, month - 1, day, startH, startM, 0, 0).getTime();
  const endsAt = new Date(
    endParts.year,
    endParts.month - 1,
    endParts.day,
    endH,
    endM,
    0,
    0,
  ).getTime();

  return { startsAt, endsAt, endDate };
}

/**
 * Calculates start and end timestamps for an Off shift.
 * Both timestamps equal local midnight of the given date.
 */
export function getOffShiftTimes(date: LocalDate): {
  startsAt: number;
  endsAt: number;
} {
  const { year, month, day } = parseLocalDate(date);
  const midnight = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();

  return { startsAt: midnight, endsAt: midnight };
}

/**
 * Determines whether a shift crosses into the next calendar day.
 * Returns false if the shift is an Off shift, otherwise true when
 * the shift ends on a date different from its starting date.
 */
export function isOvernightShift(shift: {
  readonly date: LocalDate;
  readonly endsAt: number;
  readonly isOff: boolean;
}): boolean {
  if (shift.isOff) {
    return false;
  }
  return toLocalDate(new Date(shift.endsAt)) !== shift.date;
}

/**
 * Converts an epoch millisecond timestamp to local 24-hour time of day (HH:mm).
 */
export function epochToTimeOfDay(timestamp: number): TimeOfDay {
  const d = new Date(timestamp);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}` as TimeOfDay;
}

/**
 * Formats a TimeOfDay string into 24-hour ("19:00") or 12-hour ("7:00 PM") format.
 */
export function formatTimeOfDay(time: TimeOfDay, format: TimeFormatSetting): string {
  if (format === '24h') {
    return time;
  }

  const { hours, minutes } = parseTimeOfDay(time);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mm = String(minutes).padStart(2, '0');

  return `${h12}:${mm} ${period}`;
}

/**
 * Formats total minutes since midnight (0-1439) into 24-hour ("07:00") or 12-hour ("7 AM" / "7:30 AM") format.
 */
export function formatMinutesToTime(
  totalMinutes: number,
  format: TimeFormatSetting = '24h',
): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(norm / 60);
  const minutes = norm % 60;

  if (format === '24h') {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0
    ? `${h12} ${period}`
    : `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
}
