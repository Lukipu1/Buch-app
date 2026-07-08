import * as SQLite from 'expo-sqlite';

import { LATEST_VERSION, MIGRATIONS } from './schema';

const DATABASE_NAME = 'buch.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Returns the shared database connection, opening and migrating it on first
 * use. Subsequent callers await the same promise, so migrations run exactly
 * once per app launch.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  const current = row?.user_version ?? 0;

  if (current >= LATEST_VERSION) return;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const statement of migration.statements) {
        await tx.execAsync(statement);
      }
    });
    // PRAGMA user_version does not accept bound parameters.
    await db.execAsync(`PRAGMA user_version = ${migration.version};`);
  }
}

/**
 * Test/utility helper to reset the cached connection. Not used in normal app
 * flow but handy for future integration tests.
 */
export function _resetDatabaseForTests(): void {
  dbPromise = null;
}
