import { useEffect, useRef, useState } from 'react';

import { bookRepository, pageRepository } from '@/services/database';
import { Book, Page } from '@/types/models';

interface ReaderController {
  book: Book | null;
  pages: Page[];
  loading: boolean;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

/**
 * Loads a book's pages for the reader, tracks the current page and persists
 * reading progress (debounced) whenever the page changes.
 */
export function useReaderController(
  bookId: string | undefined,
  initialPage?: number,
): ReaderController {
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(initialPage ?? 0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!bookId) {
        setLoading(false);
        return;
      }
      const [nextBook, nextPages] = await Promise.all([
        bookRepository.getById(bookId),
        pageRepository.listByBook(bookId),
      ]);
      if (!active) return;
      setBook(nextBook);
      setPages(nextPages);
      const start =
        initialPage ?? Math.min(nextBook?.currentPageIndex ?? 0, Math.max(0, nextPages.length - 1));
      setCurrentIndex(Math.max(0, Math.min(start, Math.max(0, nextPages.length - 1))));
      setLoading(false);
      if (nextBook) void bookRepository.touchOpened(nextBook.id);
    })();
    return () => {
      active = false;
    };
  }, [bookId, initialPage]);

  // Persist progress a moment after the user settles on a page.
  useEffect(() => {
    if (!bookId || loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void bookRepository.saveProgress(bookId, currentIndex);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [bookId, currentIndex, loading]);

  return { book, pages, loading, currentIndex, setCurrentIndex };
}
