export { db, DATABASE_NAME, sqliteClient, type AppDatabase } from './client';
export { useDatabaseMigrations, type MigrationResult } from './migrate';
export { DataIntegrityError } from './errors';

export {
  financeTemplates,
  monthlyFinanceConfigs,
  monthlyFinanceEntries,
  rotationExceptions,
  rotations,
  scheduledReminders,
  settings,
  shiftTemplates,
  shifts,
} from './schema';

export {
  createFinanceRepository,
  createRotationExceptionRepository,
  createRotationRepository,
  createScheduledReminderRepository,
  createSettingsRepository,
  createShiftRepository,
  createShiftTemplateRepository,
  repositories,
} from './repositories';
