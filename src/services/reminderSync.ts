import {
  addDays,
  computeDesiredReminders,
  DEFAULT_APP_SETTINGS,
  diffReminders,
  MAX_SCHEDULED_REMINDERS,
  resolveRange,
  toLocalDate,
  type DesiredReminder,
  type LocalDate,
  type ResolvedShift,
  type RotationExceptionRepository,
  type RotationRepository,
  type ScheduledReminderRepository,
  type SettingsRepository,
  type ShiftRepository,
  type ShiftTemplateRepository,
} from '@/domain';
import { repositories } from '@/db';
import { createId } from './ids';
import { createLogger } from './logger';
import {
  expoNotificationScheduler,
  expoPermissionChecker,
  type NotificationScheduler,
  type PermissionChecker,
} from './notifications';

const logger = createLogger('services:reminderSync');

export interface ReconcileRemindersRepositories {
  readonly shifts: ShiftRepository;
  readonly rotations: RotationRepository;
  readonly rotationExceptions: RotationExceptionRepository;
  readonly templates: ShiftTemplateRepository;
  readonly settings: SettingsRepository;
  readonly scheduledReminders: ScheduledReminderRepository;
}

export interface ReconcileRemindersDependencies {
  readonly repositories: ReconcileRemindersRepositories;
  readonly scheduler: NotificationScheduler;
  readonly permissions: PermissionChecker;
  readonly createId: () => string;
  readonly now?: () => number;
  readonly today?: () => LocalDate;
}

export interface ReconcileResult {
  readonly cancelledCount: number;
  readonly scheduledCount: number;
}

/**
 * Reconciles scheduled shift reminders against upcoming resolved shifts.
 * Fully idempotent: safe to call repeatedly or on app foreground.
 */
export async function reconcileReminders(
  deps?: Partial<ReconcileRemindersDependencies>,
): Promise<ReconcileResult> {
  const finalDeps: ReconcileRemindersDependencies = {
    repositories: deps?.repositories ?? repositories,
    scheduler: deps?.scheduler ?? expoNotificationScheduler,
    permissions: deps?.permissions ?? expoPermissionChecker,
    createId: deps?.createId ?? createId,
    now: deps?.now ?? Date.now,
    today: deps?.today ?? (() => toLocalDate(new Date())),
  };

  const nowMs = finalDeps.now !== undefined ? finalDeps.now() : Date.now();
  const todayDate =
    finalDeps.today !== undefined ? finalDeps.today() : toLocalDate(new Date(nowMs));
  const toDate = addDays(todayDate, 30);

  await finalDeps.scheduler.ensureChannel();

  const [
    shifts,
    rotations,
    exceptions,
    templates,
    settings,
    persisted,
    osScheduledIds,
    permissionStatus,
  ] = await Promise.all([
    finalDeps.repositories.shifts.getByDateRange(todayDate, toDate),
    finalDeps.repositories.rotations.getAll(),
    finalDeps.repositories.rotationExceptions.getByDateRange(todayDate, toDate),
    finalDeps.repositories.templates.getAll({ includeArchived: true }),
    finalDeps.repositories.settings.getOrCreate(DEFAULT_APP_SETTINGS),
    finalDeps.repositories.scheduledReminders.getAll(),
    finalDeps.scheduler.getScheduledIds(),
    finalDeps.permissions.getPermissionStatus(),
  ]);

  let desired: DesiredReminder[] = [];

  if (settings.remindersEnabled && permissionStatus === 'granted') {
    const templatesById = new Map(templates.map((t) => [t.id, t]));
    const resolvedDays = resolveRange(todayDate, toDate, {
      manualShifts: shifts,
      rotations,
      exceptions,
      templatesById,
    });

    const allShifts: ResolvedShift[] = [];
    for (const day of resolvedDays.values()) {
      allShifts.push(...day.shifts);
    }

    desired = computeDesiredReminders({
      shifts: allShifts,
      templatesById,
      preferences: {
        enabled: settings.remindersEnabled,
        minutesBefore: settings.defaultMinutesBefore,
      },
      now: nowMs,
      maxReminders: MAX_SCHEDULED_REMINDERS,
    });
  }

  const diff = diffReminders(desired, persisted, osScheduledIds);

  let cancelledCount = 0;
  for (const item of diff.toCancel) {
    if (item.notificationId !== null) {
      try {
        await finalDeps.scheduler.cancelNotification(item.notificationId);
      } catch (err: unknown) {
        logger.warn(`Failed to cancel notification ${item.notificationId}`, err);
      }
    }
    if (item.persistedId !== null) {
      try {
        await finalDeps.repositories.scheduledReminders.deleteById(item.persistedId);
        cancelledCount += 1;
      } catch (err: unknown) {
        logger.warn(`Failed to delete persisted reminder record ${item.persistedId}`, err);
      }
    }
  }

  let scheduledCount = 0;
  for (const d of diff.toSchedule) {
    try {
      const notificationId = await finalDeps.scheduler.scheduleReminder({
        shiftKey: d.shiftKey,
        shiftName: d.shiftName,
        offsetMinutes: d.offsetMinutes,
        fireAt: d.fireAt,
      });

      await finalDeps.repositories.scheduledReminders.upsert({
        id: finalDeps.createId(),
        shiftKey: d.shiftKey,
        offsetMinutes: d.offsetMinutes,
        notificationId,
        fireAt: d.fireAt,
      });

      scheduledCount += 1;
    } catch (err: unknown) {
      logger.error(
        `Failed to schedule reminder for shift ${d.shiftKey} at offset ${d.offsetMinutes}`,
        err,
      );
    }
  }

  logger.info(`Reconciliation complete: ${scheduledCount} scheduled, ${cancelledCount} cancelled`);

  return {
    cancelledCount,
    scheduledCount,
  };
}

let inFlightSync: Promise<ReconcileResult> | null = null;
let pendingSync = false;

/**
 * Requests a reminder sync coordination run with debounce/mutex protection.
 * Ensures concurrent callers wait for the active run and triggers a follow-up run if needed.
 */
export async function requestReminderSync(): Promise<ReconcileResult> {
  if (inFlightSync !== null) {
    pendingSync = true;
    return inFlightSync;
  }

  inFlightSync = (async () => {
    try {
      return await reconcileReminders();
    } finally {
      inFlightSync = null;
      if (pendingSync) {
        pendingSync = false;
        void requestReminderSync();
      }
    }
  })();

  return inFlightSync;
}
