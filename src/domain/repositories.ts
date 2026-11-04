import type { LocalDate } from './types/dates';
import type { Rotation, RotationException } from './types/rotation';
import type { Shift } from './types/shift';
import type { ShiftTemplate } from './types/template';
import type { AppSettings } from './types/settings';
import type { ScheduledReminder } from './types/reminders';
import type {
  FinanceTemplate,
  MonthlyFinanceConfig,
  MonthlyFinanceEntry,
  PayCycleProfile,
} from './finance/types';

/**
 * Repository interface for managing shift templates.
 * Templates are archived, never deleted, because rotations may reference them.
 */
export interface ShiftTemplateRepository {
  getAll(options: { readonly includeArchived: boolean }): Promise<ShiftTemplate[]>;
  getById(id: string): Promise<ShiftTemplate | null>;
  insert(template: ShiftTemplate): Promise<void>;
  update(template: ShiftTemplate): Promise<void>;
  setArchived(id: string, archivedAt: number | null): Promise<void>;
  seedIfEmpty(templates: ReadonlyArray<ShiftTemplate>): Promise<boolean>;
  deleteAll(): Promise<void>;
  insertMany(templates: ReadonlyArray<ShiftTemplate>): Promise<void>;
}

/**
 * Repository interface for managing persisted shift instances.
 */
export interface ShiftRepository {
  getAll(): Promise<Shift[]>;
  getByDateRange(from: LocalDate, to: LocalDate): Promise<Shift[]>;
  getById(id: string): Promise<Shift | null>;
  insert(shift: Shift): Promise<void>;
  update(shift: Shift): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  insertMany(shifts: ReadonlyArray<Shift>): Promise<void>;
}

/**
 * Repository interface for managing repeating rotations.
 */
export interface RotationRepository {
  getAll(): Promise<Rotation[]>;
  getById(id: string): Promise<Rotation | null>;
  insert(rotation: Rotation): Promise<void>;
  update(rotation: Rotation): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  insertMany(rotations: ReadonlyArray<Rotation>): Promise<void>;
}

/**
 * Repository interface for managing rotation exceptions.
 */
export interface RotationExceptionRepository {
  getAll(): Promise<RotationException[]>;
  getByDateRange(from: LocalDate, to: LocalDate): Promise<RotationException[]>;
  upsert(exception: RotationException): Promise<void>;
  delete(rotationId: string, date: LocalDate): Promise<void>;
  deleteAll(): Promise<void>;
  insertMany(exceptions: ReadonlyArray<RotationException>): Promise<void>;
}

/**
 * Repository interface for managing global application settings.
 */
export interface SettingsRepository {
  getOrCreate(defaults: AppSettings): Promise<AppSettings>;
  update(settings: AppSettings): Promise<void>;
}

/**
 * Repository interface for managing scheduled notification records.
 */
export interface ScheduledReminderRepository {
  getAll(): Promise<ScheduledReminder[]>;
  upsert(record: ScheduledReminder): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteByKey(shiftKey: string, offsetMinutes: number): Promise<void>;
}

/**
 * Repository interface for managing finance profiles, monthly configs, entries, and templates.
 */
export interface FinanceRepository {
  getPayCycleProfile(): Promise<PayCycleProfile>;
  savePayCycleProfile(profile: PayCycleProfile): Promise<void>;
  getMonthlyConfig(monthKey: string): Promise<MonthlyFinanceConfig | null>;
  upsertMonthlyConfig(config: MonthlyFinanceConfig): Promise<void>;
  getAllConfigs(): Promise<MonthlyFinanceConfig[]>;
  getMonthlyEntries(monthKey: string): Promise<MonthlyFinanceEntry[]>;
  getAllEntries(): Promise<MonthlyFinanceEntry[]>;
  upsertMonthlyEntry(entry: MonthlyFinanceEntry): Promise<void>;
  deleteMonthlyEntry(id: string): Promise<void>;
  setEntryPaid(id: string, isPaid: boolean): Promise<void>;
  insertMonthlyEntries(entries: ReadonlyArray<MonthlyFinanceEntry>): Promise<void>;
  getTemplates(options?: { readonly includeInactive?: boolean }): Promise<FinanceTemplate[]>;
  upsertTemplate(template: FinanceTemplate): Promise<void>;
  insertManyTemplates(templates: ReadonlyArray<FinanceTemplate>): Promise<void>;
  insertManyConfigs(configs: ReadonlyArray<MonthlyFinanceConfig>): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  getConfiguredMonths(): Promise<string[]>;
}
