import { create } from 'zustand';

import { bookRepository } from '@/services/database';
import { Book } from '@/types/models';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface LibraryState {
  books: Book[];
  status: LoadState;
  query: string;

  setQuery: (query: string) => void;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Owns the raw list of books shown in the library. Screens call `load()` on
 * mount and `refresh()` after mutations. Both search filtering and sort
 * ordering are applied on top of this list by the screen — the store keeps the
 * data source, not the presentation.
 */
export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  status: 'idle',
  query: '',

  setQuery(query) {
    set({ query });
  },

  async load() {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const books = await bookRepository.list();
      set({ books, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },

  async refresh() {
    try {
      const books = await bookRepository.list();
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
