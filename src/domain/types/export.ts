import type { AppSettings } from './settings';
import type { ShiftTemplate } from './template';
import type { Rotation, RotationException } from './rotation';
import type { Shift } from './shift';

export interface BackupPayload {
  readonly version: 1;
  readonly exportedAt: number;
  readonly settings: AppSettings;
  readonly templates: ReadonlyArray<ShiftTemplate>;
  readonly rotations: ReadonlyArray<Rotation>;
  readonly exceptions: ReadonlyArray<RotationException>;
  readonly shifts: ReadonlyArray<Shift>;
}

export interface CreateBackupData {
  readonly settings: AppSettings;
  readonly templates: ReadonlyArray<ShiftTemplate>;
  readonly rotations: ReadonlyArray<Rotation>;
  readonly exceptions: ReadonlyArray<RotationException>;
  readonly shifts: ReadonlyArray<Shift>;
  readonly exportedAt: number;
}
