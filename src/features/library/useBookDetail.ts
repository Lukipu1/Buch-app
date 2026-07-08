import { useCallback, useEffect, useState } from 'react';

import { bookRepository, pageRepository } from '@/services/database';
import { Book, Page } from '@/types/models';

interface BookDetailState {
  book: Book | null;
  pages: Page[];
  loading: boolean;
  notFound: boolean;
  reload: () => Promise<void>;
}

/** Loads a single book together with its pages and exposes a reload helper. */
export function useBookDetail(bookId: string | undefined): BookDetailState {
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(async () => {
    if (!bookId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [nextBook, nextPages] = await Promise.all([
      bookRepository.getById(bookId),
      pageRepository.listByBook(bookId),
    ]);
    setBook(nextBook);
    setPages(nextPages);
    setNotFound(nextBook === null);
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { book, pages, loading, notFound, reload };
}
