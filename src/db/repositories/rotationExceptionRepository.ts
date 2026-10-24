import { and, asc, eq, gte, lte } from 'drizzle-orm';
import type {
  LocalDate,
  RotationException,
  RotationExceptionKind,
  RotationExceptionRepository,
} from '@/domain';
import type { AppDatabase } from '../client';
import { rotationExceptions } from '../schema';
import { validateEnumMember, validateLocalDate } from './validation';

type RotationExceptionRow = typeof rotationExceptions.$inferSelect;

const ALLOWED_EXCEPTION_KINDS: readonly RotationExceptionKind[] = ['skip', 'replace'] as const;

export function mapRowToRotationException(row: RotationExceptionRow): RotationException {
  const table = 'rotation_exceptions';
  const rowId = `${row.rotationId}:${row.date}`;

  return {
    rotationId: row.rotationId,
    date: validateLocalDate(row.date, table, rowId),
    kind: validateEnumMember(row.kind, ALLOWED_EXCEPTION_KINDS, table, rowId, 'kind'),
    templateId: row.templateId,
  };
}

export function createRotationExceptionRepository(db: AppDatabase): RotationExceptionRepository {
  return {
    async getAll(): Promise<RotationException[]> {
      const rows = await db
        .select()
        .from(rotationExceptions)
        .orderBy(asc(rotationExceptions.date), asc(rotationExceptions.rotationId));

      return rows.map(mapRowToRotationException);
    },

    async getByDateRange(from: LocalDate, to: LocalDate): Promise<RotationException[]> {
      const rows = await db
        .select()
        .from(rotationExceptions)
        .where(and(gte(rotationExceptions.date, from), lte(rotationExceptions.date, to)))
        .orderBy(asc(rotationExceptions.date), asc(rotationExceptions.rotationId));

      return rows.map(mapRowToRotationException);
    },

    async upsert(exception: RotationException): Promise<void> {
      await db
        .insert(rotationExceptions)
        .values({
          rotationId: exception.rotationId,
          date: exception.date,
          kind: exception.kind,
          templateId: exception.templateId,
        })
        .onConflictDoUpdate({
          target: [rotationExceptions.rotationId, rotationExceptions.date],
          set: {
            kind: exception.kind,
            templateId: exception.templateId,
          },
        });
    },

    async delete(rotationId: string, date: LocalDate): Promise<void> {
      await db
        .delete(rotationExceptions)
        .where(
          and(eq(rotationExceptions.rotationId, rotationId), eq(rotationExceptions.date, date)),
        );
    },

    async deleteAll(): Promise<void> {
      await db.delete(rotationExceptions);
    },

    async insertMany(exceptions: ReadonlyArray<RotationException>): Promise<void> {
      if (exceptions.length === 0) {
        return;
      }
      for (const exception of exceptions) {
        await db.insert(rotationExceptions).values({
          rotationId: exception.rotationId,
          date: exception.date,
          kind: exception.kind,
          templateId: exception.templateId,
        });
      }
    },
  };
}
