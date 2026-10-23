import { nativeScanner } from '@/services/scanner/nativeScanner';
import { OcrLanguage } from '@/types/models';

import { OcrError, OcrProvider, OcrRequest, OcrResult } from './OCRProvider';
import { assembleText } from './textAssembly';

const VISION_LANGUAGES: Record<OcrLanguage, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
};

/**
 * Apple Vision (`VNRecognizeTextRequest`, accurate level). Runs fully on the
 * device — no image ever leaves the phone. Lines are rebuilt into paragraphs
 * so the reader can reflow the text.
 */
export class VisionOcrProvider implements OcrProvider {
  readonly id = 'vision';
  readonly displayName = 'Apple Vision (auf dem Gerät)';

  static isAvailable(): boolean {
    return nativeScanner !== null;
  }

  supportedLanguages(): OcrLanguage[] {
    return ['de', 'en', 'fr', 'es', 'it'];
  }

  async recognize(request: OcrRequest): Promise<OcrResult> {
    if (!nativeScanner) {
      throw new OcrError('Apple Vision ist nicht verfügbar.', 'unsupported');
    }
    const primary = VISION_LANGUAGES[request.language];
    // English as a secondary language helps with quotes and foreign words.
    const languages = primary === 'en-US' ? [primary] : [primary, 'en-US'];

    let lines;
    try {
      lines = await nativeScanner.recognizeText(request.imageUri, languages);
    } catch (error) {
      throw new OcrError(
        error instanceof Error ? error.message : 'Texterkennung fehlgeschlagen.',
        'unreadable',
      );
    }

    const confidence =
      lines.length > 0
        ? lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length
        : 0;
    return { text: assembleText(lines), confidence, provider: this.id };
  }
}
