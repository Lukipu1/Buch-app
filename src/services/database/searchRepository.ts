import { Book, PageMatch, SearchResult } from '@/types/models';

import { getDatabase } from './db';

const SNIPPET_RADIUS = 40;

/**
 * Global search across book metadata (title, author) and page OCR text.
 * Results are grouped by book with up to a handful of page-level snippets.
 */
export const searchRepository = {
  async search(rawQuery: string): Promise<SearchResult[]> {
    const query = rawQuery.trim();
    if (query.length === 0) return [];

    const db = await getDatabase();
    const like = `%${escapeLike(query)}%`;

    // 1. Books whose title/author match.
    const metadataBooks = await db.getAllAsync<Book>(
      `SELECT * FROM books
       WHERE title LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\'
       ORDER BY title COLLATE NOCASE ASC;`,
      [like, like],
    );

    // 2. Pages whose OCR text matches, joined with their book.
    const pageRows = await db.getAllAsync<PageRow>(
      `SELECT pages.id as pageId, pages.pageIndex as pageIndex,
              pages.ocrText as ocrText, books.id as bookId
       FROM pages
       JOIN books ON books.id = pages.bookId
       WHERE pages.ocrText LIKE ? ESCAPE '\\'
       ORDER BY books.title COLLATE NOCASE ASC, pages.pageIndex ASC;`,
      [like],
    );

    const results = new Map<string, SearchResult>();

    for (const book of metadataBooks) {
      results.set(book.id, { book, pageMatches: [], metadataMatch: true });
    }

    for (const row of pageRows) {
      let entry = results.get(row.bookId);
      if (!entry) {
        const book = await db.getFirstAsync<Book>(
          'SELECT * FROM books WHERE id = ?;',
          [row.bookId],
        );
        if (!book) continue;
        entry = { book, pageMatches: [], metadataMatch: false };
        results.set(row.bookId, entry);
      }
      if (entry.pageMatches.length < 5) {
        entry.pageMatches.push(buildMatch(row, query));
      }
    }

    return [...results.values()];
  },
};

interface PageRow {
  pageId: string;
  pageIndex: number;
  ocrText: string | null;
  bookId: string;
}

function buildMatch(row: PageRow, query: string): PageMatch {
  return {
    pageId: row.pageId,
    pageIndex: row.pageIndex,
    snippet: buildSnippet(row.ocrText ?? '', query),
  };
}

/** Extracts a short window of text around the first match of the query. */
function buildSnippet(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, SNIPPET_RADIUS * 2).trim();

  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(text.length, idx + query.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? '… ' : '';
  const suffix = end < text.length ? ' …' : '';
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}
