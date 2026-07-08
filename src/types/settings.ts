export type ThemePreference = 'system' | 'light' | 'dark';

/** Supported OCR languages. Extend as real providers are added. */
export type OcrLanguage = 'de' | 'en' | 'fr' | 'es' | 'it';

/** User preferences. Persisted as the single `settings` row. */
export interface Settings {
  theme: ThemePreference;
  readerFontSize: number;
  ocrLanguage: OcrLanguage;
}
