import * as FileSystem from 'expo-file-system';

/**
 * Tiny JSON key–value store for app-level metadata that isn't user "settings"
 * (e.g. whether onboarding was completed). Avoids pulling in an extra
 * async-storage dependency for a couple of flags.
 */

interface AppMeta {
  onboardingComplete: boolean;
}

const DEFAULT_META: AppMeta = { onboardingComplete: false };
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
  async isOnboardingComplete(): Promise<boolean> {
    return (await read()).onboardingComplete;
  },
  async setOnboardingComplete(value: boolean): Promise<void> {
    await write({ onboardingComplete: value });
  },
};
