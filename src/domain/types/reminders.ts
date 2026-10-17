/**
 * User-configurable preferences for shift reminders.
 * minutesBefore represents the minute offsets prior to shift start (e.g. [60, 30, 15]).
 */
export interface ReminderPreferences {
  readonly enabled: boolean;
  readonly minutesBefore: readonly number[];
}
