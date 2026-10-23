/**
 * Aggregated domain model exports. Individual models live in `book.ts`,
 * `page.ts` and `settings.ts`; this barrel keeps `@/types/models` imports
 * working from a single place.
 */
export type { Book, Bookmark, LibrarySort, SearchResult, PageMatch } from './book';
export type { Page, DraftPage, PageSide } from './page';
export type {
  Settings,
  ThemePreference,
  OcrLanguage,
  ReaderTheme,
  ReaderFont,
  ReaderSpacing,
  ReaderMargin,
  ReaderMode,
  SplitMode,
} from './settings';
