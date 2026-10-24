import type { ShiftTemplate } from './types/template';
import type { ResolvedShift } from './types/resolvedShift';
import type {
  DesiredReminder,
  ReminderPreferences,
  ScheduledReminder,
} from './types/reminders';

/**
 * Default reminder preferences.
 * This is the ONLY place these default numbers [60, 30, 15] may appear in the application.
 */
export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: true,
  minutesBefore: [60, 30, 15],
};

/**
 * Milliseconds in one minute.
 */
export const MS_PER_MINUTE = 60_000;

/**
 * 7 days in minutes; app limit that keeps reminders inside the rolling scheduling window.
 */
export const MAX_REMINDER_OFFSET_MINUTES = 10_080;

/**
 * iOS keeps at most 64 pending local notifications, so we stay below it.
 */
export const MAX_SCHEDULED_REMINDERS = 60;

/**
 * Title used for all shift reminder notifications.
 */
export const REMINDER_TITLE = 'Upcoming shift';

export interface ComputeDesiredRemindersInput {
  readonly shifts: ReadonlyArray<ResolvedShift>;
  readonly templatesById: ReadonlyMap<string, ShiftTemplate>;
  readonly preferences: ReminderPreferences;
  readonly now: number;
  readonly maxReminders: number;
}

/**
 * Validates whether a custom reminder interval in minutes is valid.
 * Used by the settings UI to validate custom intervals.
 */
export function isValidOffset(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= 1 &&
    minutes <= MAX_REMINDER_OFFSET_MINUTES
  );
}

/**
 * Normalizes an array of minute offsets:
 * - Keeps only valid offsets (per isValidOffset)
 * - Removes duplicates
 * - Sorts descending
 *
 * Returns a new array and never mutates the input.
 */
export function normalizeOffsets(offsets: ReadonlyArray<number>): number[] {
  const valid = offsets.filter(isValidOffset);
  const unique = Array.from(new Set(valid));
  return unique.sort((a, b) => b - a);
}

/**
 * Resolves the effective reminder offsets for a shift based on three tiers of precedence:
 * 1. If preferences.enabled is false: return [] (the global switch disables everything, including overrides).
 * 2. Else if shiftOverride is not null: use it (an empty array means "no reminders for this shift").
 * 3. Else if templateOverride is not null: use it.
 * 4. Else use preferences.minutesBefore.
 *
 * Always returns normalizeOffsets(chosen).
 */
export function resolveEffectiveOffsets(
  shiftOverride: ReadonlyArray<number> | null,
  templateOverride: ReadonlyArray<number> | null,
  preferences: ReminderPreferences,
): number[] {
  if (!preferences.enabled) {
    return [];
  }

  let chosen: ReadonlyArray<number>;
  if (shiftOverride !== null) {
    chosen = shiftOverride;
  } else if (templateOverride !== null) {
    chosen = templateOverride;
  } else {
    chosen = preferences.minutesBefore;
  }

  return normalizeOffsets(chosen);
}

/**
 * Computes scheduled fire timestamps for a shift:
 * - Normalizes offsets
 * - Computes fireAt = startsAt - offsetMinutes * MS_PER_MINUTE
 * - Drops any reminder whose fireAt <= now
 * - Returns remaining entries sorted by fireAt ascending
 */
export function computeFireTimes(
  startsAt: number,
  offsets: ReadonlyArray<number>,
  now: number,
): Array<{ offsetMinutes: number; fireAt: number }> {
  const normalized = normalizeOffsets(offsets);
  const results: Array<{ offsetMinutes: number; fireAt: number }> = [];

  for (const offsetMinutes of normalized) {
    const fireAt = startsAt - offsetMinutes * MS_PER_MINUTE;
    if (fireAt > now) {
      results.push({ offsetMinutes, fireAt });
    }
  }

  results.sort((a, b) => a.fireAt - b.fireAt);
  return results;
}

/**
 * Formats a duration in minutes into human-readable text with singular/plural support:
 * - 0 or less -> "now"
 * - under 60 -> "1 minute", "15 minutes"
 * - under 1440 -> hours plus leftover minutes: "1 hour", "2 hours", "1 hour 30 minutes"
 * - 1440 or more -> days plus leftover hours (leftover minutes ignored): "1 day", "2 days", "1 day 1 hour"
 */
export function formatTimeUntil(minutes: number): string {
  if (minutes <= 0) {
    return 'now';
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    const hourPart = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    if (remMinutes === 0) {
      return hourPart;
    }
    const minPart = `${remMinutes} ${remMinutes === 1 ? 'minute' : 'minutes'}`;
    return `${hourPart} ${minPart}`;
  }

  const days = Math.floor(minutes / 1440);
  const remMinutes = minutes % 1440;
  const hours = Math.floor(remMinutes / 60);
  const dayPart = `${days} ${days === 1 ? 'day' : 'days'}`;
  if (hours === 0) {
    return dayPart;
  }
  const hourPart = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${dayPart} ${hourPart}`;
}

/**
 * Builds standard notification title and body text for an upcoming shift.
 */
export function buildReminderMessage(
  shiftName: string,
  offsetMinutes: number,
): { title: string; body: string } {
  return {
    title: REMINDER_TITLE,
    body: `${shiftName} starts in ${formatTimeUntil(offsetMinutes)}`,
  };
}

function compareDesiredReminders(
  a: DesiredReminder,
  b: DesiredReminder,
): number {
  if (a.fireAt !== b.fireAt) {
    return a.fireAt - b.fireAt;
  }
  if (a.shiftKey < b.shiftKey) {
    return -1;
  }
  if (a.shiftKey > b.shiftKey) {
    return 1;
  }
  return b.offsetMinutes - a.offsetMinutes;
}

/**
 * Computes the desired set of shift reminders for scheduling.
 *
 * The caller supplies the shifts for the upcoming window (for example from resolveRange).
 *
 * Rules:
 * a. Skip Off shifts (isOff true) entirely.
 * b. Skip shifts whose startsAt is less than or equal to now.
 * c. Effective offsets = resolveEffectiveOffsets(shift.reminderOverride, template override, preferences).
 * d. For each shift, use computeFireTimes and create DesiredReminder entries.
 * e. Ensure no duplicate (shiftKey, offsetMinutes) pairs.
 * f. Sort all entries by fireAt ascending, then shiftKey, then offsetMinutes descending (deterministic order).
 * g. Keep only the first maxReminders entries (the nearest reminders in time). If maxReminders is not
 *    a positive integer, return an empty array.
 *
 * Never mutates any input.
 */
export function computeDesiredReminders(
  input: ComputeDesiredRemindersInput,
): DesiredReminder[] {
  if (!Number.isInteger(input.maxReminders) || input.maxReminders <= 0) {
    return [];
  }

  const entries: DesiredReminder[] = [];
  const seen = new Set<string>();

  for (const shift of input.shifts) {
    if (shift.isOff || shift.startsAt <= input.now) {
      continue;
    }

    const template =
      shift.templateId !== null
        ? input.templatesById.get(shift.templateId)
        : undefined;
    const templateOverride = template ? template.reminderOverride : null;

    const effectiveOffsets = resolveEffectiveOffsets(
      shift.reminderOverride,
      templateOverride,
      input.preferences,
    );

    const fireTimes = computeFireTimes(
      shift.startsAt,
      effectiveOffsets,
      input.now,
    );

    for (const ft of fireTimes) {
      const dedupeKey = `${shift.id}:${ft.offsetMinutes}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      entries.push({
        shiftKey: shift.id,
        shiftName: shift.name,
        shiftStartsAt: shift.startsAt,
        offsetMinutes: ft.offsetMinutes,
        fireAt: ft.fireAt,
      });
    }
  }

  entries.sort(compareDesiredReminders);
  return entries.slice(0, input.maxReminders);
}

export interface ReminderCancelTarget {
  readonly notificationId: string | null;
  readonly persistedId: string | null;
}

export interface ReminderDiff {
  readonly toCancel: ReadonlyArray<ReminderCancelTarget>;
  readonly toSchedule: ReadonlyArray<DesiredReminder>;
}

/**
 * Computes the reconciliation diff between desired reminders, persisted DB records,
 * and currently scheduled OS notification IDs.
 */
export function diffReminders(
  desired: ReadonlyArray<DesiredReminder>,
  persisted: ReadonlyArray<ScheduledReminder>,
  osScheduledIds: ReadonlySet<string>,
): ReminderDiff {
  const desiredByKey = new Map<string, DesiredReminder>();
  for (const d of desired) {
    desiredByKey.set(`${d.shiftKey}:${d.offsetMinutes}`, d);
  }

  const persistedByKey = new Map<string, ScheduledReminder>();
  for (const p of persisted) {
    persistedByKey.set(`${p.shiftKey}:${p.offsetMinutes}`, p);
  }

  const toCancel: ReminderCancelTarget[] = [];
  const validRetainedNotificationIds = new Set<string>();

  for (const p of persisted) {
    const key = `${p.shiftKey}:${p.offsetMinutes}`;
    const desiredMatch = desiredByKey.get(key);

    if (desiredMatch === undefined) {
      toCancel.push({
        notificationId: p.notificationId,
        persistedId: p.id,
      });
    } else if (desiredMatch.fireAt !== p.fireAt) {
      toCancel.push({
        notificationId: p.notificationId,
        persistedId: p.id,
      });
    } else if (!osScheduledIds.has(p.notificationId)) {
      toCancel.push({
        notificationId: p.notificationId,
        persistedId: p.id,
      });
    } else {
      validRetainedNotificationIds.add(p.notificationId);
    }
  }

  for (const osId of osScheduledIds) {
    if (!validRetainedNotificationIds.has(osId)) {
      const alreadyQueued = toCancel.some(
        (item) => item.notificationId === osId,
      );
      if (!alreadyQueued) {
        toCancel.push({
          notificationId: osId,
          persistedId: null,
        });
      }
    }
  }

  const toSchedule: DesiredReminder[] = [];
  for (const d of desired) {
    const key = `${d.shiftKey}:${d.offsetMinutes}`;
    const persistedMatch = persistedByKey.get(key);

    if (
      persistedMatch === undefined ||
      persistedMatch.fireAt !== d.fireAt ||
      !osScheduledIds.has(persistedMatch.notificationId)
    ) {
      toSchedule.push(d);
    }
  }

  return {
    toCancel,
    toSchedule,
  };
}
