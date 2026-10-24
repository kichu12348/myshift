import { DEFAULT_SHIFT_TEMPLATES } from '@/constants';
import { repositories } from '@/db';
import {
  DEFAULT_APP_SETTINGS,
  createBackupPayload,
  getMonthDateRange,
  resolveRange,
  shiftsToCsv,
  type BackupPayload,
  type ResolvedShift,
  type ShiftTemplate,
  type YearMonth,
} from '@/domain';
import { createLogger, reconcileReminders } from '@/services';
import { useRotationStore } from './rotationStore';
import { useSettingsStore } from './settingsStore';
import { useTemplateStore } from './templateStore';

const logger = createLogger('store:bootstrap');

/**
 * Initializes app state on startup.
 *
 * Execution order:
 * 1. Seeds default shift templates if shift_templates table is empty
 * 2. Loads app settings (or inserts defaults if first launch)
 * 3. Loads all shift templates (including archived ones)
 * 4. Loads all rotations
 *
 * If any step fails, logs the error and throws a readable Error.
 * Idempotent: calling it multiple times will not duplicate records.
 */
export async function initializeStores(): Promise<void> {
  logger.info('Initializing application stores...');

  try {
    const seeded = await repositories.templates.seedIfEmpty(DEFAULT_SHIFT_TEMPLATES);
    if (seeded) {
      logger.info('Seeded default shift templates (Day, Night, Off)');
    } else {
      logger.info('Shift templates already exist; skipping seed');
    }

    await useSettingsStore.getState().loadSettings();
    const settingsState = useSettingsStore.getState();
    if (settingsState.status === 'error') {
      throw new Error(settingsState.error ?? 'Failed to load app settings');
    }

    await useTemplateStore.getState().loadTemplates();
    const templateState = useTemplateStore.getState();
    if (templateState.status === 'error') {
      throw new Error(templateState.error ?? 'Failed to load shift templates');
    }

    await useRotationStore.getState().loadRotations();
    const rotationState = useRotationStore.getState();
    if (rotationState.status === 'error') {
      throw new Error(rotationState.error ?? 'Failed to load rotations');
    }

    logger.info('Store initialization complete');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown startup error';
    logger.error('Startup store initialization failed', err);
    throw new Error(`Startup store initialization failed: ${message}`, { cause: err });
  }
}

/**
 * Generates an RFC-4180 CSV export of resolved shifts for a given month.
 */
export async function exportMonthlyCsv(month: YearMonth): Promise<string> {
  const { from, to } = getMonthDateRange(month);
  const [shifts, exceptions, rotations, templates] = await Promise.all([
    repositories.shifts.getByDateRange(from, to),
    repositories.rotationExceptions.getByDateRange(from, to),
    repositories.rotations.getAll(),
    repositories.templates.getAll({ includeArchived: true }),
  ]);

  const templatesById = new Map<string, ShiftTemplate>();
  for (const t of templates) {
    templatesById.set(t.id, t);
  }

  const resolvedDays = resolveRange(from, to, {
    rotations,
    exceptions,
    manualShifts: shifts,
    templatesById,
  });

  const monthShifts: ResolvedShift[] = [];
  for (const day of resolvedDays.values()) {
    for (const s of day.shifts) {
      monthShifts.push(s);
    }
  }

  return shiftsToCsv(monthShifts);
}

/**
 * Creates a full versioned JSON backup payload of settings, templates, rotations,
 * exceptions, and manual shifts.
 */
export async function exportFullBackup(): Promise<string> {
  const [settings, templates, rotations, exceptions, shifts] = await Promise.all([
    repositories.settings.getOrCreate(DEFAULT_APP_SETTINGS),
    repositories.templates.getAll({ includeArchived: true }),
    repositories.rotations.getAll(),
    repositories.rotationExceptions.getAll(),
    repositories.shifts.getAll(),
  ]);

  return createBackupPayload({
    settings,
    templates,
    rotations,
    exceptions,
    shifts,
    exportedAt: Date.now(),
  });
}

/**
 * Restores database records from a verified BackupPayload, re-runs initializeStores(),
 * and reconciles notification reminders.
 */
export async function restoreDatabaseAndStores(payload: BackupPayload): Promise<void> {
  logger.info('Restoring database and stores from backup payload...');

  // 1. Delete existing records in child-to-parent order to respect foreign key constraints
  await repositories.shifts.deleteAll();
  await repositories.rotationExceptions.deleteAll();
  await repositories.rotations.deleteAll();
  await repositories.templates.deleteAll();

  // 2. Insert records in parent-to-child order
  await repositories.templates.insertMany(payload.templates);
  await repositories.rotations.insertMany(payload.rotations);
  await repositories.rotationExceptions.insertMany(payload.exceptions);
  await repositories.shifts.insertMany(payload.shifts);
  await repositories.settings.update(payload.settings);

  // 3. Re-run initializeStores to reload settings, templates, and rotations into Zustand
  await initializeStores();

  // 4. Reconcile reminders
  await reconcileReminders();

  logger.info('Database and stores restoration complete');
}
