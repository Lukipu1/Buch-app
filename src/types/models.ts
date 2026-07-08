/** Core domain models. These mirror the SQLite schema in services/database. */

export interface Book {
  id: string;
  title: string;
  author: string | null;
  coverImageUri: string | null;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
  currentPageIndex: number;
  totalPages: number;
}

export interface Page {
  id: string;
  bookId: string;
  pageIndex: number;
  imageUri: string;
  ocrText: string | null;
  createdAt: number;
}

export type ThemePreference = 'system' | 'light' | 'dark';

/** Supported OCR languages. Extend as real providers are added. */
export type OcrLanguage = 'de' | 'en' | 'fr' | 'es' | 'it';

export interface Settings {
  theme: ThemePreference;
  readerFontSize: number;
  ocrLanguage: OcrLanguage;
}

/** Options for how the library is ordered. */
export type LibrarySort = 'recentlyOpened' | 'recentlyAdded' | 'title';

/** A draft page captured during a scan session, before it is persisted. */
export interface DraftPage {
  id: string;
  imageUri: string;
  ocrText: string | null;
}

/** A single hit produced by the global search. */
export interface SearchResult {
  book: Book;
  /** Page-level matches within this book (empty when only metadata matched). */
  pageMatches: PageMatch[];
  /** True when the book title/author matched the query. */
  metadataMatch: boolean;
}

export interface PageMatch {
  pageId: string;
  pageIndex: number;
  /** A short snippet of OCR text surrounding the match. */
  snippet: string;
}
