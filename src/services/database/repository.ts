/**
 * Unified data-access facade. Groups the per-entity repositories behind a
 * single `repository` object so callers can do `repository.books.create(...)`
 * etc. The individual repositories remain available for direct import.
 */
import { bookmarkRepository } from './bookmarkRepository';
import { bookRepository } from './bookRepository';
import { pageRepository } from './pageRepository';
import { searchRepository } from './searchRepository';
import { settingsRepository } from './settingsRepository';

export const repository = {
  books: bookRepository,
  pages: pageRepository,
  bookmarks: bookmarkRepository,
  settings: settingsRepository,
  search: searchRepository,
} as const;

export {
  bookRepository,
  bookmarkRepository,
  pageRepository,
  settingsRepository,
  searchRepository,
};
export type { CreateBookInput, UpdateBookInput } from './bookRepository';
export type { AddPageInput } from './pageRepository';
