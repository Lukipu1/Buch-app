import { Book } from '@/types/book';
import { BookSortKey } from '@/types/sort';

import { readingProgress } from './format';

/**
 * Returns a new array of books ordered by the given sort key. Pure — it never
 * mutates the input, so it is safe to call inside render/`useMemo`.
 *
 * Locale-aware comparisons use German collation; missing values (no author,
 * never opened) are pushed to the end of ascending orders.
 */
export function sortBooks(books: Book[], key: BookSortKey): Book[] {
  const copy = [...books];
  copy.sort(comparatorFor(key));
  return copy;
}

type Comparator = (a: Book, b: Book) => number;

function comparatorFor(key: BookSortKey): Comparator {
  switch (key) {
    case 'recentlyOpened':
      return (a, b) =>
        nullableDesc(a.lastOpenedAt, b.lastOpenedAt) || b.updatedAt - a.updatedAt;
    case 'recentlyAdded':
      return (a, b) => b.createdAt - a.createdAt;
    case 'titleAsc':
      return (a, b) => compareText(a.title, b.title);
    case 'titleDesc':
      return (a, b) => compareText(b.title, a.title);
    case 'authorAsc':
      return (a, b) =>
        nullableTextAsc(a.author, b.author) || compareText(a.title, b.title);
    case 'pagesAsc':
      return (a, b) => a.totalPages - b.totalPages || compareText(a.title, b.title);
    case 'pagesDesc':
      return (a, b) => b.totalPages - a.totalPages || compareText(a.title, b.title);
    case 'progressAsc':
      return (a, b) => progress(a) - progress(b) || compareText(a.title, b.title);
    case 'progressDesc':
      return (a, b) => progress(b) - progress(a) || compareText(a.title, b.title);
    default:
      return () => 0;
  }
}

function progress(book: Book): number {
  return readingProgress(book.currentPageIndex, book.totalPages);
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'de', { sensitivity: 'base' });
}

/** Ascending text compare with nulls last. */
function nullableTextAsc(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return compareText(a, b);
}

/** Descending numeric compare (larger first) with nulls last. */
function nullableDesc(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}
