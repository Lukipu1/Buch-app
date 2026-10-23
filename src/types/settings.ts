export type ThemePreference = 'system' | 'light' | 'dark';

/** Supported OCR languages. Extend as real providers are added. */
export type OcrLanguage = 'de' | 'en' | 'fr' | 'es' | 'it';

/** Colour schemes of the reading view (independent of the app theme). */
export type ReaderTheme = 'light' | 'sepia' | 'green' | 'dark' | 'black';

/** Reader typefaces. Resolved to platform font families in `readerTheme.ts`. */
export type ReaderFont = 'georgia' | 'palatino' | 'iowan' | 'system';

export type ReaderSpacing = 'compact' | 'normal' | 'relaxed';
export type ReaderMargin = 'narrow' | 'normal' | 'wide';

/** `text` = reflowed recognised text, `image` = original scan. */
export type ReaderMode = 'text' | 'image';

/** How double-page spreads are handled while scanning. */
export type SplitMode = 'auto' | 'always' | 'never';

/** User preferences. Persisted as the single `settings` row. */
export interface Settings {
  theme: ThemePreference;
  readerFontSize: number;
  ocrLanguage: OcrLanguage;
  readerFont: ReaderFont;
  readerSpacing: ReaderSpacing;
  readerMargin: ReaderMargin;
  readerJustify: boolean;
  readerTheme: ReaderTheme;
  readerMode: ReaderMode;
  keepScreenAwake: boolean;
  scanSplitMode: SplitMode;
  scanAutoCrop: boolean;
}
