import * as FileSystem from 'expo-file-system';

import {
  BookSortKey,
  DEFAULT_BOOK_SORT,
  DEFAULT_PAGE_SORT,
  PageSortKey,
} from '@/types/sort';

/**
 * Tiny JSON key–value store for app-level metadata that isn't user "settings"
 * (onboarding flag, persisted sort preferences). Avoids pulling in an extra
 * async-storage dependency for a handful of values.
 */

interface AppMeta {
  onboardingComplete: boolean;
  librarySort: BookSortKey;
  pageSort: PageSortKey;
}

const DEFAULT_META: AppMeta = {
  onboardingComplete: false,
  librarySort: DEFAULT_BOOK_SORT,
  pageSort: DEFAULT_PAGE_SORT,
};

const META_PATH = `${FileSystem.documentDirectory}app-meta.json`;

async function read(): Promise<AppMeta> {
  try {
    const info = await FileSystem.getInfoAsync(META_PATH);
    if (!info.exists) return DEFAULT_META;
    const raw = await FileSystem.readAsStringAsync(META_PATH);
    return { ...DEFAULT_META, ...(JSON.parse(raw) as Partial<AppMeta>) };
  } catch {
    return DEFAULT_META;
  }
}

async function write(patch: Partial<AppMeta>): Promise<void> {
  const next = { ...(await read()), ...patch };
  await FileSystem.writeAsStringAsync(META_PATH, JSON.stringify(next));
}

export const appMeta = {
  /** Reads the full metadata object. */
  getAll(): Promise<AppMeta> {
    return read();
  },

  async isOnboardingComplete(): Promise<boolean> {
    return (await read()).onboardingComplete;
  },
  async setOnboardingComplete(value: boolean): Promise<void> {
    await write({ onboardingComplete: value });
  },

  async setLibrarySort(key: BookSortKey): Promise<void> {
    await write({ librarySort: key });
  },
  async setPageSort(key: PageSortKey): Promise<void> {
    await write({ pageSort: key });
  },
};
