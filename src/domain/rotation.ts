import type { LocalDate } from './types/dates';
import type { NewRotation } from './types/inputs';
import type { Rotation, RotationLookup } from './types/rotation';
import { addDays, compareLocalDates, daysBetween } from './dates';

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

/**
 * Discriminated union representing the non-destructive rotation edit plan.
 */
export type RotationEditPlan =
  | { readonly kind: 'update_in_place'; readonly rotation: Rotation }
  | {
      readonly kind: 'split';
      readonly closedRotation: Rotation;
      readonly newRotation: NewRotation;
    };

/**
 * Plans a non-destructive edit of an existing rotation.
 *
 * If effectiveFrom <= existing.startDate:
 * Past dates do not exist to freeze, so the rotation is updated in place.
 *
 * If effectiveFrom > existing.startDate:
 * Past dates are preserved by freezing the existing rotation (setting endDate
 * to effectiveFrom - 1 day) and starting a new rotation from effectiveFrom.
 */
export function planRotationEdit(
  existing: Rotation,
  updated: NewRotation,
  effectiveFrom: LocalDate,
): RotationEditPlan {
  if (compareLocalDates(effectiveFrom, existing.startDate) <= 0) {
    return {
      kind: 'update_in_place',
      rotation: {
        id: existing.id,
        name: updated.name,
        anchorDate: updated.anchorDate,
        pattern: [...updated.pattern],
        startDate: updated.startDate,
        endDate: updated.endDate,
        active: updated.active,
      },
    };
  }

  const splitEndDate = addDays(effectiveFrom, -1);
  const finalClosedEndDate =
    existing.endDate !== null &&
    compareLocalDates(existing.endDate, splitEndDate) < 0
      ? existing.endDate
      : splitEndDate;

  const closedRotation: Rotation = {
    ...existing,
    endDate: finalClosedEndDate,
  };

  const newRotation: NewRotation = {
    name: updated.name,
    pattern: [...updated.pattern],
    anchorDate: updated.anchorDate,
    active: true,
    startDate: effectiveFrom,
    endDate: updated.endDate,
  };

  return {
    kind: 'split',
    closedRotation,
    newRotation,
  };
}

