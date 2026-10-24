import { and, asc, eq, gte, lte } from 'drizzle-orm';
import type { LocalDate, Shift, ShiftRepository, ShiftSource } from '@/domain';
import type { AppDatabase } from '../client';
import { shifts } from '../schema';
import {
  validateEnumMember,
  validateHexColor,
  validateLocalDate,
  validateNullableNumberArray,
} from './validation';

type ShiftRow = typeof shifts.$inferSelect;

const ALLOWED_SHIFT_SOURCES: readonly ShiftSource[] = ['manual', 'rotation_override'] as const;

export function mapRowToShift(row: ShiftRow): Shift {
  const table = 'shifts';
  const rowId = row.id;

  return {
    id: row.id,
    date: validateLocalDate(row.date, table, rowId),
    templateId: row.templateId,
    name: row.name,
    icon: row.icon,
    color: validateHexColor(row.color, table, rowId),
    isOff: row.isOff,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    breakMinutes: row.breakMinutes,
    notes: row.notes,
    source: validateEnumMember(row.source, ALLOWED_SHIFT_SOURCES, table, rowId, 'source'),
    rotationId: row.rotationId,
    reminderOverride: validateNullableNumberArray(
      row.reminderOverride,
      table,
      rowId,
      'reminderOverride',
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createShiftRepository(db: AppDatabase): ShiftRepository {
  return {
    async getAll(): Promise<Shift[]> {
      const rows = await db
        .select()
        .from(shifts)
        .orderBy(asc(shifts.date), asc(shifts.startsAt), asc(shifts.id));

      return rows.map(mapRowToShift);
    },

    async getByDateRange(from: LocalDate, to: LocalDate): Promise<Shift[]> {
      const rows = await db
        .select()
        .from(shifts)
        .where(and(gte(shifts.date, from), lte(shifts.date, to)))
        .orderBy(asc(shifts.startsAt), asc(shifts.id));

      return rows.map(mapRowToShift);
    },

    async getById(id: string): Promise<Shift | null> {
      const rows = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);

      const row = rows[0];
      if (row === undefined) {
        return null;
      }

      return mapRowToShift(row);
    },

    async insert(shift: Shift): Promise<void> {
      await db.insert(shifts).values({
        id: shift.id,
        date: shift.date,
        templateId: shift.templateId,
        name: shift.name,
        icon: shift.icon,
        color: shift.color,
        isOff: shift.isOff,
        startsAt: shift.startsAt,
        endsAt: shift.endsAt,
        breakMinutes: shift.breakMinutes,
        notes: shift.notes,
        source: shift.source,
        rotationId: shift.rotationId,
        reminderOverride: shift.reminderOverride,
        createdAt: shift.createdAt,
        updatedAt: shift.updatedAt,
      });
    },

    async update(shift: Shift): Promise<void> {
      const existing = await db
        .select({ id: shifts.id })
        .from(shifts)
        .where(eq(shifts.id, shift.id))
        .limit(1);

      if (existing[0] === undefined) {
        throw new Error(`Cannot update shift: no shift found with id '${shift.id}'`);
      }

      await db
        .update(shifts)
        .set({
          date: shift.date,
          templateId: shift.templateId,
          name: shift.name,
          icon: shift.icon,
          color: shift.color,
          isOff: shift.isOff,
          startsAt: shift.startsAt,
          endsAt: shift.endsAt,
          breakMinutes: shift.breakMinutes,
          notes: shift.notes,
          source: shift.source,
          rotationId: shift.rotationId,
          reminderOverride: shift.reminderOverride,
          updatedAt: shift.updatedAt,
        })
        .where(eq(shifts.id, shift.id));
    },

    async delete(id: string): Promise<void> {
      await db.delete(shifts).where(eq(shifts.id, id));
    },

    async deleteAll(): Promise<void> {
      await db.delete(shifts);
    },

    async insertMany(items: ReadonlyArray<Shift>): Promise<void> {
      if (items.length === 0) {
        return;
      }
      for (const shift of items) {
        await db.insert(shifts).values({
          id: shift.id,
          date: shift.date,
          templateId: shift.templateId,
          name: shift.name,
          icon: shift.icon,
          color: shift.color,
          isOff: shift.isOff,
          startsAt: shift.startsAt,
          endsAt: shift.endsAt,
          breakMinutes: shift.breakMinutes,
          notes: shift.notes,
          source: shift.source,
          rotationId: shift.rotationId,
          reminderOverride: shift.reminderOverride,
          createdAt: shift.createdAt,
          updatedAt: shift.updatedAt,
        });
      }
    },
  };
}
