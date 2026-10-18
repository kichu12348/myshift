import type { LocalDate } from './types/dates';
import type { Rotation, RotationLookup } from './types/rotation';
import { compareLocalDates, daysBetween } from './dates';

/**
 * Calculates the 0-based pattern index for a given date relative to the anchor date.
 *
 * Uses daysBetween(anchorDate, date) and the formula ((days % length) + length) % length
 * so dates before the anchor date wrap backwards correctly.
 *
 * Precondition: `length` must be a positive integer (> 0).
 * Callers must check this before calling; `getRotationEntryForDate` validates this.
 */
export function rotationIndex(
  date: LocalDate,
  anchorDate: LocalDate,
  length: number,
): number {
  const days = daysBetween(anchorDate, date);
  return ((days % length) + length) % length;
}

/**
 * Determines whether a rotation is active on a specific calendar date.
 *
 * True only if rotation.active is true, date >= rotation.startDate,
 * and (rotation.endDate is null or date <= rotation.endDate).
 */
export function isRotationActiveOnDate(
  rotation: Rotation,
  date: LocalDate,
): boolean {
  if (!rotation.active) {
    return false;
  }

  if (compareLocalDates(date, rotation.startDate) < 0) {
    return false;
  }

  if (
    rotation.endDate !== null &&
    compareLocalDates(date, rotation.endDate) > 0
  ) {
    return false;
  }

  return true;
}

/**
 * Resolves the rotation pattern entry for a given date.
 *
 * Returns:
 * - { kind: "inactive" }: rotation inactive, date out of bounds, or the pattern is empty
 *   (an empty pattern is invalid and is treated as inactive; callers should ensure patterns are non-empty).
 * - { kind: "blank" }: the pattern entry for that date is null (no shift, nothing shown).
 * - { kind: "template", templateId }: the pattern entry is a template id (an Off day is a real Off template id, not null).
 */
export function getRotationEntryForDate(
  rotation: Rotation,
  date: LocalDate,
): RotationLookup {
  if (!isRotationActiveOnDate(rotation, date)) {
    return { kind: 'inactive' };
  }

  const length = rotation.pattern.length;
  // An empty pattern is invalid and is treated as inactive.
  if (length === 0) {
    return { kind: 'inactive' };
  }

  const index = rotationIndex(date, rotation.anchorDate, length);
  const entry = rotation.pattern[index];

  if (entry === undefined) {
    return { kind: 'inactive' };
  }

  if (entry === null) {
    return { kind: 'blank' };
  }

  return { kind: 'template', templateId: entry };
}
