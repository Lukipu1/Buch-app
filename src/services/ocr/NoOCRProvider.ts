import { OcrLanguage } from '@/types/models';

import { OcrError, OcrProvider, OcrResult } from './OCRProvider';

/** Used when no recognition engine exists on this platform/build. */
export class NoOcrProvider implements OcrProvider {
  readonly id = 'none';
  readonly displayName = 'Nicht verfügbar';

  supportedLanguages(): OcrLanguage[] {
    return [];
  }

  async recognize(): Promise<OcrResult> {
    throw new OcrError(
      'Texterkennung ist in diesem Build nicht verfügbar.',
      'unsupported',
    );
  }
}
