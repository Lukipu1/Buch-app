/**
 * Storage facade. Bundles persistent image storage and lightweight app
 * metadata behind one module so features import from a single entry point.
 */
import { appMeta } from './appMeta';
import { imageStorage } from './imageStorage';

export const storageService = {
  images: imageStorage,
  meta: appMeta,
} as const;

export { imageStorage, appMeta };
