import { Settings } from '@/types/models';

import { getDatabase } from './db';

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  readerFontSize: 19,
  ocrLanguage: 'de',
  readerFont: 'georgia',
  readerSpacing: 'normal',
  readerMargin: 'normal',
  readerJustify: true,
  readerTheme: 'light',
  readerMode: 'text',
  keepScreenAwake: true,
  scanSplitMode: 'auto',
  scanAutoCrop: true,
};

/** Columns stored as INTEGER 0/1 in SQLite. */
const BOOLEAN_KEYS = ['readerJustify', 'keepScreenAwake', 'scanAutoCrop'] as const;
const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

type SettingsRow = Record<keyof Settings, string | number | null>;

function fromRow(row: SettingsRow): Settings {
  const next = { ...DEFAULT_SETTINGS } as Record<keyof Settings, unknown>;
  for (const key of KEYS) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    next[key] = (BOOLEAN_KEYS as readonly string[]).includes(key)
      ? Number(value) === 1
      : value;
  }
  return next as Settings;
}

function toValue(value: Settings[keyof Settings]): string | number {
  return typeof value === 'boolean' ? (value ? 1 : 0) : value;
}

export const settingsRepository = {
  async get(): Promise<Settings> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SettingsRow>(
      `SELECT ${KEYS.join(', ')} FROM settings WHERE id = 1;`,
    );
    return row ? fromRow(row) : DEFAULT_SETTINGS;
  },

  async update(patch: Partial<Settings>): Promise<Settings> {
    const db = await getDatabase();
    const current = await this.get();
    const next: Settings = { ...current, ...patch };
    await db.runAsync(
      `UPDATE settings SET ${KEYS.map((k) => `${k} = ?`).join(', ')} WHERE id = 1;`,
      KEYS.map((k) => toValue(next[k])),
    );
    return next;
  },
};

export { DEFAULT_SETTINGS };
