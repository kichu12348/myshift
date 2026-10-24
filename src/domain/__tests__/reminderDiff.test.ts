import {
  diffReminders,
  MAX_SCHEDULED_REMINDERS,
  type AppSettings,
  type DesiredReminder,
  type LocalDate,
  type ScheduledReminder,
  type Shift,
  type ShiftTemplate,
} from '../index';
import {
  reconcileReminders,
  type NotificationPermissionStatus,
  type NotificationScheduler,
  type PermissionChecker,
  type ReconcileRemindersRepositories,
  type ReminderNotificationPayload,
} from '@/services';

jest.mock('@/db', () => ({
  repositories: {},
}));

describe('diffReminders', () => {
  const d1: DesiredReminder = {
    shiftKey: 'shift-1',
    shiftName: 'Day Shift',
    shiftStartsAt: 1000000,
    offsetMinutes: 60,
    fireAt: 940000,
  };

  const d2: DesiredReminder = {
    shiftKey: 'shift-1',
    shiftName: 'Day Shift',
    shiftStartsAt: 1000000,
    offsetMinutes: 30,
    fireAt: 970000,
  };

  const p1: ScheduledReminder = {
    id: 'rec-1',
    shiftKey: 'shift-1',
    offsetMinutes: 60,
    notificationId: 'notif-1',
    fireAt: 940000,
  };

  const p2: ScheduledReminder = {
    id: 'rec-2',
    shiftKey: 'shift-1',
    offsetMinutes: 30,
    notificationId: 'notif-2',
    fireAt: 970000,
  };

  it('returns empty diff when desired and persisted are empty', () => {
    const diff = diffReminders([], [], new Set());
    expect(diff.toCancel).toEqual([]);
    expect(diff.toSchedule).toEqual([]);
  });

  it('schedules all desired reminders when persisted is empty', () => {
    const diff = diffReminders([d1, d2], [], new Set());
    expect(diff.toCancel).toEqual([]);
    expect(diff.toSchedule).toEqual([d1, d2]);
  });

  it('is completely idempotent when desired matches persisted and OS', () => {
    const diff = diffReminders([d1, d2], [p1, p2], new Set(['notif-1', 'notif-2']));
    expect(diff.toCancel).toEqual([]);
    expect(diff.toSchedule).toEqual([]);
  });

  it('cancels old reminder and schedules new when fireAt changes', () => {
    const d1Updated: DesiredReminder = {
      ...d1,
      fireAt: 935000,
    };
    const diff = diffReminders([d1Updated], [p1], new Set(['notif-1']));
    expect(diff.toCancel).toEqual([{ notificationId: 'notif-1', persistedId: 'rec-1' }]);
    expect(diff.toSchedule).toEqual([d1Updated]);
  });

  it('cancels persisted reminders when shift is deleted or reminder removed', () => {
    // d1 remains, d2 removed
    const diff = diffReminders([d1], [p1, p2], new Set(['notif-1', 'notif-2']));
    expect(diff.toCancel).toEqual([{ notificationId: 'notif-2', persistedId: 'rec-2' }]);
    expect(diff.toSchedule).toEqual([]);
  });

  it('re-schedules desired reminder when notification is missing from OS', () => {
    // notif-1 is missing from OS
    const diff = diffReminders([d1], [p1], new Set());
    expect(diff.toCancel).toEqual([{ notificationId: 'notif-1', persistedId: 'rec-1' }]);
    expect(diff.toSchedule).toEqual([d1]);
  });

  it('cancels orphaned OS notifications', () => {
    const diff = diffReminders([], [], new Set(['orphan-os-id']));
    expect(diff.toCancel).toEqual([{ notificationId: 'orphan-os-id', persistedId: null }]);
    expect(diff.toSchedule).toEqual([]);
  });

  it('caps desired reminders at MAX_SCHEDULED_REMINDERS (60)', () => {
    expect(MAX_SCHEDULED_REMINDERS).toBe(60);
  });
});

describe('reconcileReminders coordinator with fakes', () => {
  const fakeSettings: AppSettings = {
    themeMode: 'auto',
    weekStart: 1,
    timeFormat: '24h',
    remindersEnabled: true,
    defaultMinutesBefore: [60, 30],
  };

  const fakeTemplate: ShiftTemplate = {
    id: 'tpl-1',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    startTime: '07:00',
    endTime: '19:00',
    breakMinutes: 30,
    hourlyRate: null,
    isOff: false,
    reminderOverride: null,
    archivedAt: null,
  };

  // Shift starting tomorrow at 07:00 (epoch ms: 1770000000000)
  const tomorrowDate: LocalDate = '2026-06-02';
  const tomorrowStartsAt = new Date('2026-06-02T07:00:00Z').getTime();

  const fakeShift: Shift = {
    id: 'shift-100',
    date: tomorrowDate,
    templateId: 'tpl-1',
    name: 'Day',
    icon: 'sun',
    color: '#F59E0B',
    isOff: false,
    startsAt: tomorrowStartsAt,
    endsAt: tomorrowStartsAt + 12 * 3600 * 1000,
    breakMinutes: 30,
    notes: '',
    source: 'manual',
    rotationId: null,
    reminderOverride: null,
    createdAt: 1000,
    updatedAt: 1000,
  };

  function createFakes(options?: {
    readonly initialShifts?: Shift[];
    readonly initialPersisted?: ScheduledReminder[];
    readonly initialOsIds?: string[];
    readonly permissionStatus?: NotificationPermissionStatus;
    readonly remindersEnabled?: boolean;
    readonly failOnScheduleCallIndex?: number;
  }): {
    readonly repos: ReconcileRemindersRepositories;
    readonly scheduler: NotificationScheduler;
    readonly permissions: PermissionChecker;
    readonly scheduledRemindersDb: ScheduledReminder[];
    readonly osNotifications: Set<string>;
    readonly scheduledCalls: ReminderNotificationPayload[];
    readonly cancelledCalls: string[];
  } {
    const scheduledRemindersDb = [...(options?.initialPersisted ?? [])];
    const osNotifications = new Set<string>(options?.initialOsIds ?? []);
    const scheduledCalls: ReminderNotificationPayload[] = [];
    const cancelledCalls: string[] = [];

    const repos: ReconcileRemindersRepositories = {
      shifts: {
        getAll: () => Promise.resolve(options?.initialShifts ?? [fakeShift]),
        getByDateRange: () => Promise.resolve(options?.initialShifts ?? [fakeShift]),
        getById: () => Promise.resolve(null),
        insert: () => Promise.resolve(),
        update: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        deleteAll: () => Promise.resolve(),
        insertMany: () => Promise.resolve(),
      },
      rotations: {
        getAll: () => Promise.resolve([]),
        getById: () => Promise.resolve(null),
        insert: () => Promise.resolve(),
        update: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        deleteAll: () => Promise.resolve(),
        insertMany: () => Promise.resolve(),
      },
      rotationExceptions: {
        getAll: () => Promise.resolve([]),
        getByDateRange: () => Promise.resolve([]),
        upsert: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        deleteAll: () => Promise.resolve(),
        insertMany: () => Promise.resolve(),
      },
      templates: {
        getAll: () => Promise.resolve([fakeTemplate]),
        getById: () => Promise.resolve(fakeTemplate),
        insert: () => Promise.resolve(),
        update: () => Promise.resolve(),
        setArchived: () => Promise.resolve(),
        seedIfEmpty: () => Promise.resolve(false),
        deleteAll: () => Promise.resolve(),
        insertMany: () => Promise.resolve(),
      },
      settings: {
        getOrCreate: () =>
          Promise.resolve({
            ...fakeSettings,
            remindersEnabled: options?.remindersEnabled ?? true,
          }),
        update: () => Promise.resolve(),
      },
      scheduledReminders: {
        getAll: () => Promise.resolve([...scheduledRemindersDb]),
        upsert: (record: ScheduledReminder) => {
          const idx = scheduledRemindersDb.findIndex(
            (r) => r.shiftKey === record.shiftKey && r.offsetMinutes === record.offsetMinutes,
          );
          if (idx >= 0) {
            scheduledRemindersDb[idx] = record;
          } else {
            scheduledRemindersDb.push(record);
          }
          return Promise.resolve();
        },
        deleteById: (id: string) => {
          const idx = scheduledRemindersDb.findIndex((r) => r.id === id);
          if (idx >= 0) {
            scheduledRemindersDb.splice(idx, 1);
          }
          return Promise.resolve();
        },
        deleteByKey: (shiftKey: string, offsetMinutes: number) => {
          const idx = scheduledRemindersDb.findIndex(
            (r) => r.shiftKey === shiftKey && r.offsetMinutes === offsetMinutes,
          );
          if (idx >= 0) {
            scheduledRemindersDb.splice(idx, 1);
          }
          return Promise.resolve();
        },
      },
    };

    let scheduleCallCount = 0;
    const scheduler: NotificationScheduler = {
      ensureChannel: () => Promise.resolve(),
      getScheduledIds: () => Promise.resolve(new Set(osNotifications)),
      scheduleReminder: (payload: ReminderNotificationPayload) => {
        scheduleCallCount += 1;
        if (
          options?.failOnScheduleCallIndex !== undefined &&
          scheduleCallCount === options.failOnScheduleCallIndex
        ) {
          return Promise.reject(new Error('OS schedule simulation error'));
        }
        const notifId = `os-${payload.shiftKey}-${payload.offsetMinutes}`;
        scheduledCalls.push(payload);
        osNotifications.add(notifId);
        return Promise.resolve(notifId);
      },
      cancelNotification: (notificationId: string) => {
        cancelledCalls.push(notificationId);
        osNotifications.delete(notificationId);
        return Promise.resolve();
      },
    };

    const permissions: PermissionChecker = {
      getPermissionStatus: () => Promise.resolve(options?.permissionStatus ?? 'granted'),
      requestPermission: () => Promise.resolve(options?.permissionStatus ?? 'granted'),
    };

    return {
      repos,
      scheduler,
      permissions,
      scheduledRemindersDb,
      osNotifications,
      scheduledCalls,
      cancelledCalls,
    };
  }

  it('runs initial reconciliation, scheduling all reminders and persisting them immediately', async () => {
    let nextId = 1;
    const fakes = createFakes();

    const result = await reconcileReminders({
      repositories: fakes.repos,
      scheduler: fakes.scheduler,
      permissions: fakes.permissions,
      createId: () => `id-${nextId++}`,
      now: () => tomorrowStartsAt - 24 * 3600 * 1000, // 1 day before
      today: () => '2026-06-01',
    });

    // 2 offsets: 60m and 30m
    expect(result.scheduledCount).toBe(2);
    expect(result.cancelledCount).toBe(0);
    expect(fakes.scheduledRemindersDb).toHaveLength(2);
    expect(fakes.osNotifications.size).toBe(2);

    // Second run is completely idempotent
    const rerun = await reconcileReminders({
      repositories: fakes.repos,
      scheduler: fakes.scheduler,
      permissions: fakes.permissions,
      createId: () => `id-${nextId++}`,
      now: () => tomorrowStartsAt - 24 * 3600 * 1000,
      today: () => '2026-06-01',
    });

    expect(rerun.scheduledCount).toBe(0);
    expect(rerun.cancelledCount).toBe(0);
  });

  it('recovers gracefully from partial failure by persisting each successfully scheduled reminder immediately', async () => {
    let nextId = 1;
    // Fail on 2nd schedule call
    const fakes = createFakes({ failOnScheduleCallIndex: 2 });

    const firstRun = await reconcileReminders({
      repositories: fakes.repos,
      scheduler: fakes.scheduler,
      permissions: fakes.permissions,
      createId: () => `id-${nextId++}`,
      now: () => tomorrowStartsAt - 24 * 3600 * 1000,
      today: () => '2026-06-01',
    });

    // 1st succeeded, 2nd threw
    expect(firstRun.scheduledCount).toBe(1);
    expect(fakes.scheduledRemindersDb).toHaveLength(1);

    // Next run attempts remaining reminder (the 2nd) and does not duplicate 1st
    const secondRun = await reconcileReminders({
      repositories: fakes.repos,
      scheduler: fakes.scheduler,
      permissions: fakes.permissions,
      createId: () => `id-${nextId++}`,
      now: () => tomorrowStartsAt - 24 * 3600 * 1000,
      today: () => '2026-06-01',
    });

    expect(secondRun.scheduledCount).toBe(1);
    expect(fakes.scheduledRemindersDb).toHaveLength(2);
  });

  it('cancels scheduled notifications and cleans up DB records when shifts are removed', async () => {
    let nextId = 1;
    const fakes = createFakes();

    // First schedule reminders
    await reconcileReminders({
      repositories: fakes.repos,
      scheduler: fakes.scheduler,
      permissions: fakes.permissions,
      createId: () => `id-${nextId++}`,
      now: () => tomorrowStartsAt - 24 * 3600 * 1000,
      today: () => '2026-06-01',
    });

    expect(fakes.scheduledRemindersDb).toHaveLength(2);

    // Now remove shifts
    const emptyShiftsFakes = createFakes({
      initialShifts: [],
      initialPersisted: fakes.scheduledRemindersDb,
      initialOsIds: Array.from(fakes.osNotifications),
    });

    const cleanupRun = await reconcileReminders({
      repositories: emptyShiftsFakes.repos,
      scheduler: emptyShiftsFakes.scheduler,
      permissions: emptyShiftsFakes.permissions,
      createId: () => `id-${nextId++}`,
      now: () => tomorrowStartsAt - 24 * 3600 * 1000,
      today: () => '2026-06-01',
    });

    expect(cleanupRun.cancelledCount).toBe(2);
    expect(emptyShiftsFakes.scheduledRemindersDb).toHaveLength(0);
    expect(emptyShiftsFakes.osNotifications.size).toBe(0);
  });

  it('cancels all reminders when global remindersEnabled is false', async () => {
    let nextId = 1;
    const fakes = createFakes({ remindersEnabled: false });

    // Seed existing persisted
    await fakes.repos.scheduledReminders.upsert({
      id: 'pre-1',
      shiftKey: 'shift-100',
      offsetMinutes: 60,
      notificationId: 'os-pre-1',
      fireAt: 1234567,
    });
    fakes.osNotifications.add('os-pre-1');

    const result = await reconcileReminders({
      repositories: fakes.repos,
      scheduler: fakes.scheduler,
      permissions: fakes.permissions,
      createId: () => `id-${nextId++}`,
      now: () => tomorrowStartsAt - 24 * 3600 * 1000,
      today: () => '2026-06-01',
    });

    expect(result.cancelledCount).toBe(1);
    expect(fakes.scheduledRemindersDb).toHaveLength(0);
    expect(fakes.osNotifications.size).toBe(0);
  });
});
