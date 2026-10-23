import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { bookRepository, bookmarkRepository, pageRepository } from '@/services/database';
import { useOcrStore } from '@/store/useOcrStore';
import { Book, Bookmark, Page } from '@/types/models';

/** Position = page (array index) + character offset inside that page's text. */
export interface ReaderPosition {
  pageIdx: number;
  local: number;
}

interface ReaderController {
  book: Book | null;
  pages: Page[];
  bookmarks: Bookmark[];
  loading: boolean;
  /** Where reading starts. Set once after loading. */
  initialPosition: ReaderPosition;
  /** Call whenever the visible position changes. Persists debounced. */
  reportPosition: (position: ReaderPosition) => void;
  addBookmark: (pageId: string, textOffset: number, snippet: string | null) => Promise<void>;
  removeBookmarks: (ids: string[]) => Promise<void>;
}

/** Idle gaps longer than this don't count as reading time. */
const MAX_ACTIVITY_GAP = 3 * 60_000;

/**
 * Loads a book for the reader, keeps pages fresh while text recognition runs,
 * persists the reading position and tracks active reading time.
 */
export function useReaderController(
  bookId: string | undefined,
  initialPageIndex?: number,
): ReaderController {
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialPosition, setInitialPosition] = useState<ReaderPosition>({ pageIdx: 0, local: 0 });

  const pagesRef = useRef<Page[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<ReaderPosition | null>(null);
  const lastActivity = useRef(Date.now());
  const unsavedTime = useRef(0);

  // Initial load.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!bookId) {
        setLoading(false);
        return;
      }
      const [nextBook, nextPages, nextBookmarks] = await Promise.all([
        bookRepository.getById(bookId),
        pageRepository.listByBook(bookId),
        bookmarkRepository.listByBook(bookId),
      ]);
      if (!active) return;

      const fromParam =
        initialPageIndex !== undefined
          ? nextPages.findIndex((p) => p.pageIndex === initialPageIndex)
          : -1;
      const pageIdx =
        fromParam >= 0
          ? fromParam
          : Math.min(nextBook?.currentPageIndex ?? 0, Math.max(0, nextPages.length - 1));
      const local = fromParam >= 0 ? 0 : (nextBook?.readingOffset ?? 0);

      pagesRef.current = nextPages;
      setBook(nextBook);
      setPages(nextPages);
      setBookmarks(nextBookmarks);
      setInitialPosition({ pageIdx: Math.max(0, pageIdx), local });
      setLoading(false);
      if (nextBook) void bookRepository.touchOpened(nextBook.id);
    })();
    return () => {
      active = false;
    };
  }, [bookId, initialPageIndex]);

  // Pick up newly recognised text once a recognition run finishes.
  const ocrVersion = useOcrStore((s) => (bookId ? (s.versions[bookId] ?? 0) : 0));
  const ocrRunning = useOcrStore((s) => (bookId ? Boolean(s.jobs[bookId]) : false));
  const seenVersion = useRef(ocrVersion);
  useEffect(() => {
    if (!bookId || loading || ocrVersion === seenVersion.current) return;
    const hasText = pagesRef.current.some((p) => p.ocrText);
    // While a run is in progress only refresh when there is nothing to read yet,
    // so the text doesn't re-flow under the reader every few pages.
    if (ocrRunning && hasText) return;
    seenVersion.current = ocrVersion;
    void pageRepository.listByBook(bookId).then((next) => {
      pagesRef.current = next;
      setPages(next);
    });
  }, [bookId, loading, ocrRunning, ocrVersion]);

  const flushTime = useCallback(() => {
    if (!bookId) return;
    const now = Date.now();
    unsavedTime.current += Math.min(now - lastActivity.current, MAX_ACTIVITY_GAP);
    lastActivity.current = now;
    const ms = unsavedTime.current;
    unsavedTime.current = 0;
    void bookRepository.addReadingTime(bookId, ms);
  }, [bookId]);

  const flushPosition = useCallback(() => {
    const position = pendingSave.current;
    const page = position ? pagesRef.current[position.pageIdx] : undefined;
    if (!bookId || !position || !page) return;
    pendingSave.current = null;
    void bookRepository.saveProgress(bookId, page.pageIndex, position.local);
  }, [bookId]);

  const reportPosition = useCallback(
    (position: ReaderPosition) => {
      const now = Date.now();
      unsavedTime.current += Math.min(now - lastActivity.current, MAX_ACTIVITY_GAP);
      lastActivity.current = now;

      pendingSave.current = position;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushPosition, 400);
    },
    [flushPosition],
  );

  // Flush on background and unmount.
  useEffect(() => {
    lastActivity.current = Date.now();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        lastActivity.current = Date.now();
      } else {
        flushPosition();
        flushTime();
      }
    });
    return () => {
      sub.remove();
      if (saveTimer.current) clearTimeout(saveTimer.current);
      flushPosition();
      flushTime();
    };
  }, [flushPosition, flushTime]);

  const addBookmark = useCallback(
    async (pageId: string, textOffset: number, snippet: string | null) => {
      if (!bookId) return;
      await bookmarkRepository.create({ bookId, pageId, textOffset, snippet });
      setBookmarks(await bookmarkRepository.listByBook(bookId));
    },
    [bookId],
  );

  const removeBookmarks = useCallback(
    async (ids: string[]) => {
      if (!bookId) return;
      await Promise.all(ids.map((id) => bookmarkRepository.delete(id)));
      setBookmarks(await bookmarkRepository.listByBook(bookId));
    },
    [bookId],
  );

  return {
    book,
    pages,
    bookmarks,
    loading,
    initialPosition,
    reportPosition,
    addBookmark,
    removeBookmarks,
  };
}
