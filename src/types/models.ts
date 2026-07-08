/**
 * Aggregated domain model exports. Individual models live in `book.ts`,
 * `page.ts` and `settings.ts`; this barrel keeps `@/types/models` imports
 * working from a single place.
 */
export type { Book, LibrarySort, SearchResult, PageMatch } from './book';
export type { Page, DraftPage } from './page';
export type { Settings, ThemePreference, OcrLanguage } from './settings';
export type { BookSortKey, PageSortKey, SortOption } from './sort';
