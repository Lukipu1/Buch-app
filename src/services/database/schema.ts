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
  {
    version: 2,
    statements: [
      // Reading position inside a page + reading statistics.
      `ALTER TABLE books ADD COLUMN readingOffset INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE books ADD COLUMN readingTimeMs INTEGER NOT NULL DEFAULT 0;`,
      // Reader & scanner preferences.
      `ALTER TABLE settings ADD COLUMN readerFont TEXT NOT NULL DEFAULT 'georgia';`,
      `ALTER TABLE settings ADD COLUMN readerSpacing TEXT NOT NULL DEFAULT 'normal';`,
      `ALTER TABLE settings ADD COLUMN readerMargin TEXT NOT NULL DEFAULT 'normal';`,
      `ALTER TABLE settings ADD COLUMN readerJustify INTEGER NOT NULL DEFAULT 1;`,
      `ALTER TABLE settings ADD COLUMN readerTheme TEXT NOT NULL DEFAULT 'light';`,
      `ALTER TABLE settings ADD COLUMN readerMode TEXT NOT NULL DEFAULT 'text';`,
      `ALTER TABLE settings ADD COLUMN keepScreenAwake INTEGER NOT NULL DEFAULT 1;`,
      `ALTER TABLE settings ADD COLUMN scanSplitMode TEXT NOT NULL DEFAULT 'auto';`,
      `ALTER TABLE settings ADD COLUMN scanAutoCrop INTEGER NOT NULL DEFAULT 1;`,
      // The app is designed light-first.
      `UPDATE settings SET theme = 'light' WHERE theme = 'system';`,
      `CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY NOT NULL,
        bookId TEXT NOT NULL,
        pageId TEXT NOT NULL,
        textOffset INTEGER NOT NULL DEFAULT 0,
        snippet TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (bookId) REFERENCES books (id) ON DELETE CASCADE,
        FOREIGN KEY (pageId) REFERENCES pages (id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_bookmarks_book ON bookmarks (bookId);`,
    ],
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
