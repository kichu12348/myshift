import type { LocalDate } from './dates';

export type ShiftSource = 'manual' | 'rotation_override';

/**
 * Persisted shift instance for a specific date.
 * Note: For an Off shift, startsAt and endsAt both equal local midnight of its date,
 * and Off shifts never get reminders.
 */
export interface Shift {
  readonly id: string;
  readonly date: LocalDate;
  readonly templateId: string | null;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly isOff: boolean;
  readonly startsAt: number;
  readonly endsAt: number;
  readonly breakMinutes: number;
  readonly notes: string;
  readonly source: ShiftSource;
  readonly rotationId: string | null;
  readonly reminderOverride: number[] | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}
