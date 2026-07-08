/**
 * Sort definitions for the library (books) and for pages within a book.
 * These are plain string unions plus label metadata — no UI/RN dependency —
 * so they can be shared by pure sort utilities, the store and components.
 */

/** All supported orderings for the library. */
export type BookSortKey =
  | 'recentlyOpened'
  | 'recentlyAdded'
  | 'titleAsc'
  | 'titleDesc'
  | 'authorAsc'
  | 'pagesAsc'
  | 'pagesDesc'
  | 'progressAsc'
  | 'progressDesc';

/** All supported orderings for a book's pages. */
export type PageSortKey =
  | 'indexAsc'
  | 'indexDesc'
  | 'createdAsc'
  | 'createdDesc';

export interface SortOption<T extends string> {
  key: T;
  label: string;
}

export const BOOK_SORT_OPTIONS: SortOption<BookSortKey>[] = [
  { key: 'recentlyOpened', label: 'Zuletzt geöffnet' },
  { key: 'recentlyAdded', label: 'Zuletzt hinzugefügt' },
  { key: 'titleAsc', label: 'Titel A–Z' },
  { key: 'titleDesc', label: 'Titel Z–A' },
  { key: 'authorAsc', label: 'Autor A–Z' },
  { key: 'pagesAsc', label: 'Seiten aufsteigend' },
  { key: 'pagesDesc', label: 'Seiten absteigend' },
  { key: 'progressAsc', label: 'Fortschritt aufsteigend' },
  { key: 'progressDesc', label: 'Fortschritt absteigend' },
];

export const PAGE_SORT_OPTIONS: SortOption<PageSortKey>[] = [
  { key: 'indexAsc', label: 'Seitenindex aufsteigend' },
  { key: 'indexDesc', label: 'Seitenindex absteigend' },
  { key: 'createdAsc', label: 'Erstellungsdatum (älteste zuerst)' },
  { key: 'createdDesc', label: 'Erstellungsdatum (neueste zuerst)' },
];

export const DEFAULT_BOOK_SORT: BookSortKey = 'recentlyAdded';
export const DEFAULT_PAGE_SORT: PageSortKey = 'indexAsc';

/** Human-readable label for a book sort key. */
export function bookSortLabel(key: BookSortKey): string {
  return BOOK_SORT_OPTIONS.find((o) => o.key === key)?.label ?? '';
}

/** Human-readable label for a page sort key. */
export function pageSortLabel(key: PageSortKey): string {
  return PAGE_SORT_OPTIONS.find((o) => o.key === key)?.label ?? '';
}
