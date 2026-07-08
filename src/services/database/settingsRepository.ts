import { Settings } from '@/types/models';

import { getDatabase } from './db';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  readerFontSize: 17,
  ocrLanguage: 'de',
};

export const settingsRepository = {
  async get(): Promise<Settings> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Settings>(
      'SELECT theme, readerFontSize, ocrLanguage FROM settings WHERE id = 1;',
    );
    return row ?? DEFAULT_SETTINGS;
  },

  async update(patch: Partial<Settings>): Promise<Settings> {
    const db = await getDatabase();
    const current = await this.get();
    const next: Settings = { ...current, ...patch };
    await db.runAsync(
      'UPDATE settings SET theme = ?, readerFontSize = ?, ocrLanguage = ? WHERE id = 1;',
      [next.theme, next.readerFontSize, next.ocrLanguage],
    );
    return next;
  },
};

export { DEFAULT_SETTINGS };
