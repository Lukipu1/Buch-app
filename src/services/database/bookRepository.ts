import { Book, LibrarySort } from '@/types/models';
import { createId } from '@/utils/ids';

import { getDatabase } from './db';

export interface CreateBookInput {
  title: string;
  author?: string | null;
  coverImageUri?: string | null;
}

export interface UpdateBookInput {
  title?: string;
  author?: string | null;
  coverImageUri?: string | null;
}

const ORDER_BY: Record<LibrarySort, string> = {
  recentlyOpened: 'lastOpenedAt DESC, updatedAt DESC',
  recentlyAdded: 'createdAt DESC',
  title: 'title COLLATE NOCASE ASC',
};

export const bookRepository = {
  async list(sort: LibrarySort = 'recentlyAdded'): Promise<Book[]> {
    const db = await getDatabase();
    return db.getAllAsync<Book>(
      `SELECT * FROM books ORDER BY ${ORDER_BY[sort]};`,
    );
  },

  async getById(id: string): Promise<Book | null> {
    const db = await getDatabase();
    const book = await db.getFirstAsync<Book>(
      'SELECT * FROM books WHERE id = ?;',
      [id],
    );
    return book ?? null;
  },

  async create(input: CreateBookInput): Promise<Book> {
    const db = await getDatabase();
    const now = Date.now();
    const book: Book = {
      id: createId(),
      title: input.title.trim(),
      author: input.author?.trim() || null,
      coverImageUri: input.coverImageUri ?? null,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: null,
      currentPageIndex: 0,
      totalPages: 0,
    };
    await db.runAsync(
      `INSERT INTO books
        (id, title, author, coverImageUri, createdAt, updatedAt, lastOpenedAt, currentPageIndex, totalPages)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        book.id,
        book.title,
        book.author,
        book.coverImageUri,
        book.createdAt,
        book.updatedAt,
        book.lastOpenedAt,
        book.currentPageIndex,
        book.totalPages,
      ],
    );
    return book;
  },

  async update(id: string, input: UpdateBookInput): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.title !== undefined) {
      fields.push('title = ?');
      values.push(input.title.trim());
    }
    if (input.author !== undefined) {
      fields.push('author = ?');
      values.push(input.author?.trim() || null);
    }
    if (input.coverImageUri !== undefined) {
      fields.push('coverImageUri = ?');
      values.push(input.coverImageUri);
    }

    if (fields.length === 0) return;

    fields.push('updatedAt = ?');
    values.push(Date.now());
    values.push(id);

    await db.runAsync(
      `UPDATE books SET ${fields.join(', ')} WHERE id = ?;`,
      values,
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    // Pages are removed automatically via ON DELETE CASCADE.
    await db.runAsync('DELETE FROM books WHERE id = ?;', [id]);
  },

  /** Persists reading progress and stamps the book as recently opened. */
  async saveProgress(id: string, currentPageIndex: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE books SET currentPageIndex = ?, lastOpenedAt = ?, updatedAt = ? WHERE id = ?;',
      [currentPageIndex, Date.now(), Date.now(), id],
    );
  },

  /** Marks the book as opened without changing the current page. */
  async touchOpened(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE books SET lastOpenedAt = ? WHERE id = ?;', [
      Date.now(),
      id,
    ]);
  },

  /**
   * Recomputes `totalPages` and clamps `currentPageIndex` to a valid range.
   * Called after pages are added, removed or reordered.
   */
  async syncPageCount(id: string): Promise<void> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM pages WHERE bookId = ?;',
      [id],
    );
    const total = row?.count ?? 0;
    const clampedIndex = Math.max(0, total - 1);
    await db.runAsync(
      'UPDATE books SET totalPages = ?, currentPageIndex = MIN(currentPageIndex, ?), updatedAt = ? WHERE id = ?;',
      [total, clampedIndex, Date.now(), id],
    );
  },
};
