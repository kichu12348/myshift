import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'myshift.db';

export const sqliteClient = openDatabaseSync(DATABASE_NAME);

// SQLite has foreign key enforcement disabled by default.
// Turning PRAGMA foreign_keys = ON ensures database referential integrity
// (e.g. ON DELETE CASCADE and ON DELETE SET NULL constraints are respected).
sqliteClient.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqliteClient, { schema });

export type AppDatabase = typeof db;
