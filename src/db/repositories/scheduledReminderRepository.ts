import { and, eq } from 'drizzle-orm';
import type { ScheduledReminder, ScheduledReminderRepository } from '@/domain';
import type { AppDatabase } from '../client';
import { DataIntegrityError } from '../errors';
import { scheduledReminders } from '../schema';

type ScheduledReminderRow = typeof scheduledReminders.$inferSelect;

export function mapRowToScheduledReminder(row: ScheduledReminderRow): ScheduledReminder {
  const table = 'scheduled_reminders';
  const rowId = row.id;

  if (typeof row.id !== 'string' || row.id.trim().length === 0) {
    throw new DataIntegrityError(table, rowId, 'Invalid id');
  }
  if (typeof row.shiftKey !== 'string' || row.shiftKey.trim().length === 0) {
    throw new DataIntegrityError(table, rowId, 'Invalid shiftKey');
  }
  if (!Number.isFinite(row.offsetMinutes)) {
    throw new DataIntegrityError(table, rowId, 'Invalid offsetMinutes');
  }
  if (typeof row.notificationId !== 'string' || row.notificationId.trim().length === 0) {
    throw new DataIntegrityError(table, rowId, 'Invalid notificationId');
  }
  if (!Number.isFinite(row.fireAt)) {
    throw new DataIntegrityError(table, rowId, 'Invalid fireAt');
  }

  return {
    id: row.id,
    shiftKey: row.shiftKey,
    offsetMinutes: row.offsetMinutes,
    notificationId: row.notificationId,
    fireAt: row.fireAt,
  };
}

export function createScheduledReminderRepository(db: AppDatabase): ScheduledReminderRepository {
  return {
    async getAll(): Promise<ScheduledReminder[]> {
      const rows = await db.select().from(scheduledReminders);
      return rows.map(mapRowToScheduledReminder);
    },

    async upsert(record: ScheduledReminder): Promise<void> {
      await db
        .insert(scheduledReminders)
        .values({
          id: record.id,
          shiftKey: record.shiftKey,
          offsetMinutes: record.offsetMinutes,
          notificationId: record.notificationId,
          fireAt: record.fireAt,
          createdAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: [scheduledReminders.shiftKey, scheduledReminders.offsetMinutes],
          set: {
            id: record.id,
            notificationId: record.notificationId,
            fireAt: record.fireAt,
          },
        });
    },

    async deleteById(id: string): Promise<void> {
      await db.delete(scheduledReminders).where(eq(scheduledReminders.id, id));
    },

    async deleteByKey(shiftKey: string, offsetMinutes: number): Promise<void> {
      await db
        .delete(scheduledReminders)
        .where(
          and(
            eq(scheduledReminders.shiftKey, shiftKey),
            eq(scheduledReminders.offsetMinutes, offsetMinutes),
          ),
        );
    },
  };
}
