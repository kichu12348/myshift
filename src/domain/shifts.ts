import type { Shift } from './types/shift';
import {
  epochToTimeOfDay,
  isOvernightShift,
  timeOfDayToMinutes,
} from './dates';

export interface ShiftTimeInterval {
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly isOff: boolean;
}

export { isOvernightShift };

/**
 * Checks whether two shifts overlap on the same calendar date.
 *
 * Rules:
 * - If either `a.isOff` or `b.isOff` is true, returns true (an Off day conflicts with everything on that date,
 *   including another Off entry).
 * - Converts each shift's [start, end) interval into minutes from 00:00 of that date:
 *     endAdjusted = endMinutes <= startMinutes ? endMinutes + 1440 : endMinutes
 * - Returns `aStart < bEndAdjusted && bStart < aEndAdjusted`.
 * - Back-to-back shifts (e.g. 07:00-19:00 and 19:00-07:00) do NOT overlap.
 */
export function doShiftsOverlapOnSameDate(
  a: ShiftTimeInterval,
  b: ShiftTimeInterval,
): boolean {
  if (a.isOff || b.isOff) {
    return true;
  }

  const aStart = a.startMinutes;
  const aEndAdjusted = a.endMinutes <= a.startMinutes ? a.endMinutes + 1440 : a.endMinutes;

  const bStart = b.startMinutes;
  const bEndAdjusted = b.endMinutes <= b.startMinutes ? b.endMinutes + 1440 : b.endMinutes;

  return aStart < bEndAdjusted && bStart < aEndAdjusted;
}

export interface IncomingShiftConflictInput {
  readonly templateId?: string | null;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly isOff: boolean;
}

export type ShiftConflictCandidate = Pick<
  Shift,
  'id' | 'isOff' | 'templateId' | 'startsAt' | 'endsAt'
>;

/**
 * Returns the list of existing shift IDs on that date that must be removed before/when inserting incomingShift:
 * - If incomingShift.isOff === true: Returns all existing shift IDs on that date (adding "Off" clears all working
 *   shifts and any existing Off shift on that day).
 * - If incomingShift.isOff === false: Returns the IDs of:
 *   1. Any existing shift on that date where isOff === true (adding a working shift automatically clears "Off").
 *   2. Any existing shift on that date with the same templateId (prevents duplicate templates on the same day).
 *   3. Any existing shift on that date where doShiftsOverlapOnSameDate(existing, incomingShift) === true
 *      (replaces overlapping shifts automatically instead of stacking impossible hours).
 */
export function resolveConflictingShiftIds(
  existingShiftsOnDate: ReadonlyArray<ShiftConflictCandidate>,
  incomingShift: IncomingShiftConflictInput,
): string[] {
  if (incomingShift.isOff) {
    return existingShiftsOnDate.map((s) => s.id);
  }

  const conflictingIds: string[] = [];

  for (const existing of existingShiftsOnDate) {
    // 1. Any existing shift on that date where isOff === true
    if (existing.isOff) {
      conflictingIds.push(existing.id);
      continue;
    }

    // 2. Any existing shift on that date with the same templateId
    if (
      incomingShift.templateId !== undefined &&
      incomingShift.templateId !== null &&
      existing.templateId === incomingShift.templateId
    ) {
      conflictingIds.push(existing.id);
      continue;
    }

    // 3. Any existing shift on that date where doShiftsOverlapOnSameDate(existing, incomingShift) === true
    const existingStartMinutes = timeOfDayToMinutes(epochToTimeOfDay(existing.startsAt));
    const existingEndMinutes = timeOfDayToMinutes(epochToTimeOfDay(existing.endsAt));
    if (
      doShiftsOverlapOnSameDate(
        {
          startMinutes: existingStartMinutes,
          endMinutes: existingEndMinutes,
          isOff: existing.isOff,
        },
        incomingShift,
      )
    ) {
      conflictingIds.push(existing.id);
    }
  }

  return Array.from(new Set(conflictingIds));
}

