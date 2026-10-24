import type { ShiftSystemPresetId } from '@/constants';

export type SchedulePatternType = 'variable' | 'rotation';

export interface OnboardingState {
  readonly presetId: ShiftSystemPresetId;
  readonly scheduleType: SchedulePatternType;
  readonly rotationOptionId: string | null;
}
