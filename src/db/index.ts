export { db, DATABASE_NAME, sqliteClient, type AppDatabase } from './client';
export { useDatabaseMigrations, type MigrationResult } from './migrate';
export { DataIntegrityError } from './errors';

export {
  rotationExceptions,
  rotations,
  scheduledReminders,
  settings,
  shiftTemplates,
  shifts,
} from './schema';

export {
  createRotationExceptionRepository,
  createRotationRepository,
  createSettingsRepository,
  createShiftRepository,
  createShiftTemplateRepository,
  repositories,
} from './repositories';
