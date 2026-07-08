import { Page } from './page';
import { BookSortKey } from './sort';

/** A scanned book with its reading progress. Mirrors the `books` table. */
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

/**
 * Options for how the library is ordered.
 * Canonical keys live in `sort.ts`; this alias is kept for existing imports.
 */
export type LibrarySort = BookSortKey;

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

/** Re-exported for convenience so `Book` and `Page` can be imported together. */
export type { Page };
