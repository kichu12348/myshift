import type { LocalDate } from './dates';

/**
 * An entry in a rotation pattern.
 * A template id, or null for a blank day with no entry.
 * Note: An Off day is a real Off template id, not null.
 */
export type RotationPatternEntry = string | null;

export type RotationExceptionKind = 'skip' | 'replace';

export interface Rotation {
  readonly id: string;
  readonly name: string;
  readonly anchorDate: LocalDate;
  readonly pattern: readonly RotationPatternEntry[];
  readonly startDate: LocalDate;
  readonly endDate: LocalDate | null;
  readonly active: boolean;
}

export interface RotationException {
  readonly rotationId: string;
  readonly date: LocalDate;
  readonly kind: RotationExceptionKind;
  readonly templateId: string | null;
}

/**
 * Result of evaluating a rotation on a specific date.
 * - 'inactive': rotation is inactive, date is out of active range, or pattern is empty (empty pattern is invalid and treated as inactive).
 * - 'blank': pattern entry for that date is null (no shift, nothing shown).
 * - 'template': pattern entry is a template id (an Off day is a real Off template id, not null).
 */
export type RotationLookup =
  | { readonly kind: 'inactive' }
  | { readonly kind: 'blank' }
  | { readonly kind: 'template'; readonly templateId: string };

