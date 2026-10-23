import { MockOcrProvider } from './MockOCRProvider';
import { NoOcrProvider } from './NoOCRProvider';
import { OcrProvider } from './OCRProvider';
import { VisionOcrProvider } from './VisionOCRProvider';

/**
 * OCR provider registry. The active provider is chosen here so the rest of the
 * app depends only on the `OcrProvider` interface.
 *
 * Default resolution:
 *   1. Apple Vision (iOS dev/production build with the BuchScanner module)
 *   2. Mock provider (development only, e.g. Expo Go)
 *   3. None — pages simply keep no text
 *
 * To add another engine (ML Kit, Tesseract, …) implement `OcrProvider`,
 * register it below and adjust `resolveDefault`.
 */

const providers = {
  vision: new VisionOcrProvider(),
  mock: new MockOcrProvider(),
  none: new NoOcrProvider(),
} as const;

export type OcrProviderId = keyof typeof providers;

function resolveDefault(): OcrProviderId {
  if (VisionOcrProvider.isAvailable()) return 'vision';
  if (__DEV__) return 'mock';
  return 'none';
}

let activeProviderId: OcrProviderId = resolveDefault();

export function getOcrProvider(): OcrProvider {
  return providers[activeProviderId];
}

export function setOcrProvider(id: OcrProviderId): void {
  activeProviderId = id;
}

/** False when no engine can recognise text in this build. */
export function isOcrAvailable(): boolean {
  return activeProviderId !== 'none';
}

export { assembleText } from './textAssembly';
export * from './OCRProvider';
