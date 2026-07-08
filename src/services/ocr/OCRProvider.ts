import { OcrLanguage } from '@/types/models';

export interface OcrRequest {
  /** Local URI of the image (or PDF page) to recognise. */
  imageUri: string;
  /** Language hint for the recognition engine. */
  language: OcrLanguage;
}

export interface OcrResult {
  text: string;
  /** Overall confidence 0–1, when the provider reports one. */
  confidence: number;
  /** Provider identifier that produced this result. */
  provider: string;
}

/** Distinguishes recoverable OCR failures from unexpected crashes. */
export class OcrError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'unsupported'
      | 'unreadable'
      | 'network'
      | 'cancelled'
      | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'OcrError';
  }
}

/**
 * Contract every OCR engine must fulfil. Swap the concrete implementation
 * (Apple Vision, ML Kit, Tesseract, a cloud API …) without touching callers.
 */
export interface OcrProvider {
  readonly id: string;
  /** Human-readable name for settings/debug UIs. */
  readonly displayName: string;
  /** Recognises text in a single image/page. */
  recognize(request: OcrRequest): Promise<OcrResult>;
  /** Languages this provider can handle. */
  supportedLanguages(): OcrLanguage[];
}
