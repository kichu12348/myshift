/**
 * User-configurable preferences for shift reminders.
 * minutesBefore represents the minute offsets prior to shift start (e.g. [60, 30, 15]).
 */
export interface ReminderPreferences {
  readonly enabled: boolean;
  readonly minutesBefore: readonly number[];
}

/**
 * A desired shift reminder ready for scheduling.
 * `shiftKey` is the ResolvedShift id (a stored shift id, or "rotation:<rotationId>:<date>" for virtual shifts).
 */
export interface DesiredReminder {
  readonly shiftKey: string;
  readonly shiftName: string;
  readonly shiftStartsAt: number;
  readonly offsetMinutes: number;
  readonly fireAt: number;
}

/**
 * Persisted record of a scheduled notification for an upcoming shift.
 */
export interface ScheduledReminder {
  readonly id: string;
  readonly shiftKey: string;
  readonly offsetMinutes: number;
  readonly notificationId: string;
  readonly fireAt: number;
}
