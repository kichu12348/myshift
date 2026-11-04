import type { AppSettings } from './settings';
import type { ShiftTemplate } from './template';
import type { Rotation, RotationException } from './rotation';
import type { Shift } from './shift';
import type {
  FinanceTemplate,
  MonthlyFinanceConfig,
  MonthlyFinanceEntry,
  PayCycleProfile,
} from './finance';

export interface BackupPayload {
  readonly version: 1;
  readonly exportedAt: number;
  readonly settings: AppSettings;
  readonly templates: ReadonlyArray<ShiftTemplate>;
  readonly rotations: ReadonlyArray<Rotation>;
  readonly exceptions: ReadonlyArray<RotationException>;
  readonly shifts: ReadonlyArray<Shift>;
  readonly payCycleProfile?: PayCycleProfile | undefined;
  readonly financeTemplates?: ReadonlyArray<FinanceTemplate> | undefined;
  readonly monthlyConfigs?: ReadonlyArray<MonthlyFinanceConfig> | undefined;
  readonly monthlyEntries?: ReadonlyArray<MonthlyFinanceEntry> | undefined;
}

export interface CreateBackupData {
  readonly settings: AppSettings;
  readonly templates: ReadonlyArray<ShiftTemplate>;
  readonly rotations: ReadonlyArray<Rotation>;
  readonly exceptions: ReadonlyArray<RotationException>;
  readonly shifts: ReadonlyArray<Shift>;
  readonly exportedAt: number;
  readonly payCycleProfile?: PayCycleProfile | undefined;
  readonly financeTemplates?: ReadonlyArray<FinanceTemplate> | undefined;
  readonly monthlyConfigs?: ReadonlyArray<MonthlyFinanceConfig> | undefined;
  readonly monthlyEntries?: ReadonlyArray<MonthlyFinanceEntry> | undefined;
}
