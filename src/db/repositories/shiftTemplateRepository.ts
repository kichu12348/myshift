import { asc, eq, isNull } from 'drizzle-orm';
import type { ShiftTemplate } from '@/domain';
import type { ShiftTemplateRepository } from '@/domain';
import type { AppDatabase } from '../client';
import { shiftTemplates } from '../schema';
import { validateHexColor, validateNullableNumberArray, validateTimeOfDay } from './validation';

type ShiftTemplateRow = typeof shiftTemplates.$inferSelect;

export function mapRowToShiftTemplate(row: ShiftTemplateRow): ShiftTemplate {
  const table = 'shift_templates';
  const rowId = row.id;

  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: validateHexColor(row.color, table, rowId),
    startTime: validateTimeOfDay(row.startTime, table, rowId),
    endTime: validateTimeOfDay(row.endTime, table, rowId),
    breakMinutes: row.breakMinutes,
    hourlyRate: row.hourlyRate,
    isOff: row.isOff,
    reminderOverride: validateNullableNumberArray(
      row.reminderOverride,
      table,
      rowId,
      'reminderOverride',
    ),
    archivedAt: row.archivedAt,
  };
}

export function createShiftTemplateRepository(db: AppDatabase): ShiftTemplateRepository {
  return {
    async getAll(options: { readonly includeArchived: boolean }): Promise<ShiftTemplate[]> {
      const query = options.includeArchived
        ? db
            .select()
            .from(shiftTemplates)
            .orderBy(asc(shiftTemplates.createdAt), asc(shiftTemplates.id))
        : db
            .select()
            .from(shiftTemplates)
            .where(isNull(shiftTemplates.archivedAt))
            .orderBy(asc(shiftTemplates.createdAt), asc(shiftTemplates.id));

      const rows = await query;
      return rows.map(mapRowToShiftTemplate);
    },

    async getById(id: string): Promise<ShiftTemplate | null> {
      const rows = await db.select().from(shiftTemplates).where(eq(shiftTemplates.id, id)).limit(1);

      const row = rows[0];
      if (row === undefined) {
        return null;
      }

      return mapRowToShiftTemplate(row);
    },

    async insert(template: ShiftTemplate): Promise<void> {
      await db.insert(shiftTemplates).values({
        id: template.id,
        name: template.name,
        icon: template.icon,
        color: template.color,
        startTime: template.startTime,
        endTime: template.endTime,
        breakMinutes: template.breakMinutes,
        hourlyRate: template.hourlyRate,
        isOff: template.isOff,
        reminderOverride: template.reminderOverride,
        archivedAt: template.archivedAt,
        createdAt: Date.now(),
      });
    },

    async update(template: ShiftTemplate): Promise<void> {
      const existing = await db
        .select({ id: shiftTemplates.id })
        .from(shiftTemplates)
        .where(eq(shiftTemplates.id, template.id))
        .limit(1);

      if (existing[0] === undefined) {
        throw new Error(`Cannot update shift template: no template found with id '${template.id}'`);
      }

      await db
        .update(shiftTemplates)
        .set({
          name: template.name,
          icon: template.icon,
          color: template.color,
          startTime: template.startTime,
          endTime: template.endTime,
          breakMinutes: template.breakMinutes,
          hourlyRate: template.hourlyRate,
          isOff: template.isOff,
          reminderOverride: template.reminderOverride,
          archivedAt: template.archivedAt,
        })
        .where(eq(shiftTemplates.id, template.id));
    },

    async setArchived(id: string, archivedAt: number | null): Promise<void> {
      const existing = await db
        .select({ id: shiftTemplates.id })
        .from(shiftTemplates)
        .where(eq(shiftTemplates.id, id))
        .limit(1);

      if (existing[0] === undefined) {
        throw new Error(`Cannot archive shift template: no template found with id '${id}'`);
      }

      await db.update(shiftTemplates).set({ archivedAt }).where(eq(shiftTemplates.id, id));
    },

    async seedIfEmpty(templates: ReadonlyArray<ShiftTemplate>): Promise<boolean> {
      const existing = await db.select({ id: shiftTemplates.id }).from(shiftTemplates).limit(1);

      if (existing.length > 0) {
        return false;
      }

      await db.transaction(async (tx) => {
        const doubleCheck = await tx
          .select({ id: shiftTemplates.id })
          .from(shiftTemplates)
          .limit(1);

        if (doubleCheck.length > 0) {
          return;
        }

        const now = Date.now();
        for (const template of templates) {
          await tx.insert(shiftTemplates).values({
            id: template.id,
            name: template.name,
            icon: template.icon,
            color: template.color,
            startTime: template.startTime,
            endTime: template.endTime,
            breakMinutes: template.breakMinutes,
            hourlyRate: template.hourlyRate,
            isOff: template.isOff,
            reminderOverride: template.reminderOverride,
            archivedAt: template.archivedAt,
            createdAt: now,
          });
        }
      });

      return true;
    },

    async deleteAll(): Promise<void> {
      await db.delete(shiftTemplates);
    },

    async insertMany(templates: ReadonlyArray<ShiftTemplate>): Promise<void> {
      if (templates.length === 0) {
        return;
      }
      const now = Date.now();
      for (const template of templates) {
        await db.insert(shiftTemplates).values({
          id: template.id,
          name: template.name,
          icon: template.icon,
          color: template.color,
          startTime: template.startTime,
          endTime: template.endTime,
          breakMinutes: template.breakMinutes,
          hourlyRate: template.hourlyRate,
          isOff: template.isOff,
          reminderOverride: template.reminderOverride,
          archivedAt: template.archivedAt,
          createdAt: now,
        });
      }
    },
  };
}
