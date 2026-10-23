import * as FileSystem from 'expo-file-system';

import { createId } from '@/utils/ids';

/**
 * Persists scanned page images inside the app's document directory so they
 * survive cache clears. Images captured by the camera or picked from the
 * gallery live in temporary locations; we copy them into a stable folder and
 * store the resulting URI in the database.
 */

const PAGES_DIR = `${FileSystem.documentDirectory}pages/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PAGES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PAGES_DIR, { intermediates: true });
  }
}

export const imageStorage = {
  /**
   * Moves (temporary cache files) or copies a source image into persistent
   * storage and returns the new URI.
   */
  async persist(sourceUri: string): Promise<string> {
    await ensureDir();
    const extension = guessExtension(sourceUri);
    const target = `${PAGES_DIR}${createId()}.${extension}`;
    const isTemporary =
      !!FileSystem.cacheDirectory && sourceUri.startsWith(FileSystem.cacheDirectory);
    if (isTemporary) {
      try {
        await FileSystem.moveAsync({ from: sourceUri, to: target });
        return target;
      } catch {
        // Fall through to copying (e.g. file still in use).
      }
    }
    await FileSystem.copyAsync({ from: sourceUri, to: target });
    return target;
  },

  /** Removes a stored image. Missing files are ignored. */
  async remove(uri: string): Promise<void> {
    if (!uri.startsWith(PAGES_DIR)) return;
    await FileSystem.deleteAsync(uri, { idempotent: true });
  },

  /** Total bytes used by persisted page images. */
  async usageBytes(): Promise<number> {
    const info = await FileSystem.getInfoAsync(PAGES_DIR);
    if (!info.exists) return 0;
    const files = await FileSystem.readDirectoryAsync(PAGES_DIR);
    let total = 0;
    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${PAGES_DIR}${file}`, {
        size: true,
      });
      if (fileInfo.exists && !fileInfo.isDirectory) {
        total += fileInfo.size ?? 0;
      }
    }
    return total;
  },
};

function guessExtension(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  const ext = match?.[1]?.toLowerCase();
  return ext && ext.length <= 4 ? ext : 'jpg';
}
