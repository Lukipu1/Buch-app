import { create } from 'zustand';

import { getDatabase } from '@/services/database';
import { appMeta } from '@/services/storage/appMeta';
import {
  BookSortKey,
  DEFAULT_BOOK_SORT,
  DEFAULT_PAGE_SORT,
  PageSortKey,
} from '@/types/sort';
import { seedMockDataIfEmpty } from '@/utils/mockData';

import { useSettingsStore } from './useSettingsStore';

interface AppState {
  ready: boolean;
  onboardingComplete: boolean;

  /** Active ordering for the library grid. */
  librarySort: BookSortKey;
  /** Active ordering for page lists (book detail, scanner drafts). */
  pageSort: PageSortKey;

  /** Runs migrations, hydrates settings/prefs and seeds mock data. Idempotent. */
  bootstrap: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setLibrarySort: (key: BookSortKey) => void;
  setPageSort: (key: PageSortKey) => void;
}

/**
 * Coordinates app startup and holds cross-screen preferences (sort orders).
 * The root layout awaits `bootstrap()` before hiding the splash screen so the
 * first frame already has data, the correct theme and persisted sort choices.
 * Sort changes are written through to `appMeta` so they survive restarts.
 */
export const useAppStore = create<AppState>((set) => ({
  ready: false,
  onboardingComplete: false,
  librarySort: DEFAULT_BOOK_SORT,
  pageSort: DEFAULT_PAGE_SORT,

  async bootstrap() {
    await getDatabase(); // opens + migrates
    await useSettingsStore.getState().hydrate();
    if (__DEV__) {
      await seedMockDataIfEmpty();
    }
    const meta = await appMeta.getAll();
    set({
      ready: true,
      onboardingComplete: meta.onboardingComplete,
      librarySort: meta.librarySort,
      pageSort: meta.pageSort,
    });
  },

  async completeOnboarding() {
    await appMeta.setOnboardingComplete(true);
    set({ onboardingComplete: true });
  },

  setLibrarySort(key) {
    set({ librarySort: key });
    void appMeta.setLibrarySort(key);
  },

  setPageSort(key) {
    set({ pageSort: key });
    void appMeta.setPageSort(key);
  },
}));
