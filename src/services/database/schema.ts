/**
 * SQLite schema and migrations.
 *
 * Migrations are applied in order based on the database `user_version`
 * pragma. To evolve the schema, append a new entry to `MIGRATIONS` — never
 * edit an existing one — so upgrades stay deterministic across app versions.
 */

export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        coverImageUri TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        lastOpenedAt INTEGER,
        currentPageIndex INTEGER NOT NULL DEFAULT 0,
        totalPages INTEGER NOT NULL DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY NOT NULL,
        bookId TEXT NOT NULL,
        pageIndex INTEGER NOT NULL,
        imageUri TEXT NOT NULL,
        ocrText TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (bookId) REFERENCES books (id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_pages_book ON pages (bookId, pageIndex);`,
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        theme TEXT NOT NULL DEFAULT 'system',
        readerFontSize INTEGER NOT NULL DEFAULT 17,
        ocrLanguage TEXT NOT NULL DEFAULT 'de'
      );`,
      `INSERT OR IGNORE INTO settings (id) VALUES (1);`,
    ],
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
