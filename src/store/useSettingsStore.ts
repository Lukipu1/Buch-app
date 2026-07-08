import { create } from 'zustand';

import { DEFAULT_SETTINGS, settingsRepository } from '@/services/database';
import { Settings } from '@/types/models';

interface SettingsState {
  settings: Settings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

/**
 * Holds the single Settings row. Hydrated once on app start; every update is
 * written through to SQLite so preferences persist across launches.
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  async hydrate() {
    if (get().hydrated) return;
    const settings = await settingsRepository.get();
    set({ settings, hydrated: true });
  },

  async update(patch) {
    const next = await settingsRepository.update(patch);
    set({ settings: next });
  },
}));
