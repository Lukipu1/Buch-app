import { MockOcrProvider } from './MockOcrProvider';
import { OcrProvider } from './types';

/**
 * OCR provider registry. The active provider is chosen here so the rest of the
 * app depends only on the `OcrProvider` interface.
 *
 * To add a real engine:
 *   1. Implement `OcrProvider` (see MockOcrProvider for reference).
 *      - Apple Vision   → a small native/Expo module bridging VNRecognizeText.
 *      - Google ML Kit  → e.g. via a config plugin + native text recognizer.
 *      - Tesseract      → a WASM/native binding.
 *      - Cloud API      → fetch() to your endpoint (respect the local-first
 *                          privacy stance — only upload with explicit consent).
 *   2. Register it below and switch `activeProvider`.
 */

const providers = {
  mock: new MockOcrProvider(),
} as const;

export type OcrProviderId = keyof typeof providers;

let activeProviderId: OcrProviderId = 'mock';

export function getOcrProvider(): OcrProvider {
  return providers[activeProviderId];
}

export function setOcrProvider(id: OcrProviderId): void {
  activeProviderId = id;
}

export * from './types';
