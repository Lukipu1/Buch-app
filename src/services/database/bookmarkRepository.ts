import { Bookmark } from '@/types/models';
import { createId } from '@/utils/ids';

import { getDatabase } from './db';

export interface CreateBookmarkInput {
  bookId: string;
  pageId: string;
  textOffset: number;
  snippet: string | null;
}

export const bookmarkRepository = {
  async listByBook(bookId: string): Promise<Bookmark[]> {
    const db = await getDatabase();
    return db.getAllAsync<Bookmark>(
      `SELECT bookmarks.* FROM bookmarks
       JOIN pages ON pages.id = bookmarks.pageId
       WHERE bookmarks.bookId = ?
       ORDER BY pages.pageIndex ASC, bookmarks.textOffset ASC;`,
      [bookId],
    );
  },

  async create(input: CreateBookmarkInput): Promise<Bookmark> {
    const db = await getDatabase();
    const bookmark: Bookmark = {
      id: createId(),
      bookId: input.bookId,
      pageId: input.pageId,
      textOffset: Math.max(0, Math.round(input.textOffset)),
      snippet: input.snippet,
      createdAt: Date.now(),
    };
    await db.runAsync(
      `INSERT INTO bookmarks (id, bookId, pageId, textOffset, snippet, createdAt)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        bookmark.id,
        bookmark.bookId,
        bookmark.pageId,
        bookmark.textOffset,
        bookmark.snippet,
        bookmark.createdAt,
      ],
    );
    return bookmark;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?;', [id]);
  },
};
