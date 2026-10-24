import { asc, eq } from 'drizzle-orm';
import type { Rotation } from '@/domain';
import type { RotationRepository } from '@/domain';
import type { AppDatabase } from '../client';
import { rotations } from '../schema';
import {
  validateLocalDate,
  validateNullableLocalDate,
  validateRotationPattern,
} from './validation';

type RotationRow = typeof rotations.$inferSelect;

export function mapRowToRotation(row: RotationRow): Rotation {
  const table = 'rotations';
  const rowId = row.id;

  return {
    id: row.id,
    name: row.name,
    anchorDate: validateLocalDate(row.anchorDate, table, rowId),
    pattern: validateRotationPattern(row.pattern, table, rowId),
    startDate: validateLocalDate(row.startDate, table, rowId),
    endDate: validateNullableLocalDate(row.endDate, table, rowId),
    active: row.active,
  };
}

export function createRotationRepository(db: AppDatabase): RotationRepository {
  return {
    async getAll(): Promise<Rotation[]> {
      const rows = await db
        .select()
        .from(rotations)
        .orderBy(asc(rotations.createdAt), asc(rotations.id));

      return rows.map(mapRowToRotation);
    },

    async getById(id: string): Promise<Rotation | null> {
      const rows = await db.select().from(rotations).where(eq(rotations.id, id)).limit(1);

      const row = rows[0];
      if (row === undefined) {
        return null;
      }

      return mapRowToRotation(row);
    },

    async insert(rotation: Rotation): Promise<void> {
      await db.insert(rotations).values({
        id: rotation.id,
        name: rotation.name,
        anchorDate: rotation.anchorDate,
        pattern: [...rotation.pattern],
        startDate: rotation.startDate,
        endDate: rotation.endDate,
        active: rotation.active,
        createdAt: Date.now(),
      });
    },

    async update(rotation: Rotation): Promise<void> {
      const existing = await db
        .select({ id: rotations.id })
        .from(rotations)
        .where(eq(rotations.id, rotation.id))
        .limit(1);

      if (existing[0] === undefined) {
        throw new Error(`Cannot update rotation: no rotation found with id '${rotation.id}'`);
      }

      await db
        .update(rotations)
        .set({
          name: rotation.name,
          anchorDate: rotation.anchorDate,
          pattern: [...rotation.pattern],
          startDate: rotation.startDate,
          endDate: rotation.endDate,
          active: rotation.active,
        })
        .where(eq(rotations.id, rotation.id));
    },

    async delete(id: string): Promise<void> {
      await db.delete(rotations).where(eq(rotations.id, id));
    },

    async deleteAll(): Promise<void> {
      await db.delete(rotations);
    },

    async insertMany(items: ReadonlyArray<Rotation>): Promise<void> {
      if (items.length === 0) {
        return;
      }
      const now = Date.now();
      for (const rotation of items) {
        await db.insert(rotations).values({
          id: rotation.id,
          name: rotation.name,
          anchorDate: rotation.anchorDate,
          pattern: [...rotation.pattern],
          startDate: rotation.startDate,
          endDate: rotation.endDate,
          active: rotation.active,
          createdAt: now,
        });
      }
    },
  };
}
