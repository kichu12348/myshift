import type { LocalDate } from './types/dates';
import type { Rotation, RotationException } from './types/rotation';
import type { Shift } from './types/shift';
import type { ShiftTemplate } from './types/template';
import type { AppSettings } from './types/settings';

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
}

/**
 * Repository interface for managing persisted shift instances.
 */
export interface ShiftRepository {
  getByDateRange(from: LocalDate, to: LocalDate): Promise<Shift[]>;
  getById(id: string): Promise<Shift | null>;
  insert(shift: Shift): Promise<void>;
  update(shift: Shift): Promise<void>;
  delete(id: string): Promise<void>;
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
}

/**
 * Repository interface for managing rotation exceptions.
 */
export interface RotationExceptionRepository {
  getByDateRange(from: LocalDate, to: LocalDate): Promise<RotationException[]>;
  upsert(exception: RotationException): Promise<void>;
  delete(rotationId: string, date: LocalDate): Promise<void>;
}

/**
 * Repository interface for managing global application settings.
 */
export interface SettingsRepository {
  getOrCreate(defaults: AppSettings): Promise<AppSettings>;
  update(settings: AppSettings): Promise<void>;
}
