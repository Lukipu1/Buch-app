import { create } from 'zustand';

import { getDatabase } from '@/services/database';
import { appMeta } from '@/services/storage/appMeta';
import { seedMockDataIfEmpty } from '@/utils/mockData';

import { useSettingsStore } from './useSettingsStore';

interface AppState {
  ready: boolean;
  onboardingComplete: boolean;
  /** Runs migrations, hydrates settings and seeds mock data. Idempotent. */
  bootstrap: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

/**
 * Coordinates app startup. The root layout awaits `bootstrap()` before hiding
 * the splash screen so the first frame already has data and the correct theme.
 */
export const useAppStore = create<AppState>((set) => ({
  ready: false,
  onboardingComplete: false,

  async bootstrap() {
    await getDatabase(); // opens + migrates
    await useSettingsStore.getState().hydrate();
    if (__DEV__) {
      await seedMockDataIfEmpty();
    }
    const onboardingComplete = await appMeta.isOnboardingComplete();
    set({ ready: true, onboardingComplete });
  },

  async completeOnboarding() {
    await appMeta.setOnboardingComplete(true);
    set({ onboardingComplete: true });
  },
}));
