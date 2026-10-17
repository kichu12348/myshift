import type { TimeOfDay } from './dates';

/**
 * Reusable shift template definition.
 * Note: For an Off template, startTime and endTime are "00:00" and are ignored.
 */
export interface ShiftTemplate {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
  readonly breakMinutes: number;
  readonly hourlyRate: number | null;
  readonly isOff: boolean;
  readonly reminderOverride: number[] | null;
  readonly archivedAt: number | null;
}
