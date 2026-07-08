import { OcrLanguage } from '@/types/models';

import { OcrProvider, OcrRequest, OcrResult } from './OCRProvider';

/**
 * Development-only provider. Returns deterministic placeholder text after a
 * short delay so the rest of the app (persistence, reader text mode, search)
 * can be built and tested before a real engine is wired in.
 */
export class MockOcrProvider implements OcrProvider {
  readonly id = 'mock';
  readonly displayName = 'Mock (Entwicklung)';

  supportedLanguages(): OcrLanguage[] {
    return ['de', 'en', 'fr', 'es', 'it'];
  }

  async recognize(request: OcrRequest): Promise<OcrResult> {
    await delay(400);
    return {
      text: sampleText(request.language),
      confidence: 0.5,
      provider: this.id,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sampleText(language: OcrLanguage): string {
  const samples: Record<OcrLanguage, string> = {
    de: 'Dies ist ein Beispieltext, der von der Mock-OCR erzeugt wurde. Der echte Provider ersetzt ihn später durch den tatsächlich erkannten Seiteninhalt.',
    en: 'This is sample text produced by the mock OCR provider. A real engine will replace it with the recognised page content later.',
    fr: 'Ceci est un exemple de texte généré par le fournisseur OCR fictif.',
    es: 'Este es un texto de ejemplo generado por el proveedor de OCR simulado.',
    it: 'Questo è un testo di esempio generato dal provider OCR fittizio.',
  };
  return samples[language];
}
