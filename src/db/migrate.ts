import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../../drizzle/migrations';
import { db } from './client';

export type MigrationResult =
  | { readonly status: 'loading' }
  | { readonly status: 'ready' }
  | { readonly status: 'error'; readonly message: string };

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown database migration error';
}

/**
 * Hook wrapping Drizzle migrations for SQLite database initialization.
 * Returns the current migration status: loading, ready, or error.
 */
export function useDatabaseMigrations(): MigrationResult {
  const { success, error } = useMigrations(db, migrations);

  if (error !== undefined) {
    return {
      status: 'error',
      message: extractErrorMessage(error),
    };
  }

  if (success) {
    return { status: 'ready' };
  }

  return { status: 'loading' };
}
