import { create } from 'zustand';

import { bookRepository } from '@/services/database';
import { Book, LibrarySort } from '@/types/models';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface LibraryState {
  books: Book[];
  status: LoadState;
  sort: LibrarySort;
  query: string;

  setSort: (sort: LibrarySort) => void;
  setQuery: (query: string) => void;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Owns the list of books shown in the library. Screens call `load()` on mount
 * and `refresh()` after mutations (create/delete). Filtering by the search
 * query is derived, not stored, via `selectVisibleBooks`.
 */
export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  status: 'idle',
  sort: 'recentlyAdded',
  query: '',

  setSort(sort) {
    set({ sort });
    void get().refresh();
  },

  setQuery(query) {
    set({ query });
  },

  async load() {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const books = await bookRepository.list(get().sort);
      set({ books, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },

  async refresh() {
    try {
      const books = await bookRepository.list(get().sort);
      set({ books, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
}));

/** Case-insensitive title/author filter applied on top of the loaded books. */
export function selectVisibleBooks(state: LibraryState): Book[] {
  const q = state.query.trim().toLowerCase();
  if (!q) return state.books;
  return state.books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      (b.author?.toLowerCase().includes(q) ?? false),
  );
}
