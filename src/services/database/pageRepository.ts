import { imageStorage } from '@/services/storage/imageStorage';
import { Page } from '@/types/models';
import { createId } from '@/utils/ids';

import { bookRepository } from './bookRepository';
import { getDatabase } from './db';

export interface AddPageInput {
  imageUri: string;
  ocrText?: string | null;
}

export const pageRepository = {
  async listByBook(bookId: string): Promise<Page[]> {
    const db = await getDatabase();
    return db.getAllAsync<Page>(
      'SELECT * FROM pages WHERE bookId = ? ORDER BY pageIndex ASC;',
      [bookId],
    );
  },

  async getByIndex(bookId: string, pageIndex: number): Promise<Page | null> {
    const db = await getDatabase();
    const page = await db.getFirstAsync<Page>(
      'SELECT * FROM pages WHERE bookId = ? AND pageIndex = ?;',
      [bookId, pageIndex],
    );
    return page ?? null;
  },

  /**
   * Appends pages to a book, continuing the existing page numbering, then
   * refreshes the book's page count. All inserts run in a single transaction.
   */
  async addPages(bookId: string, inputs: AddPageInput[]): Promise<void> {
    if (inputs.length === 0) return;
    const db = await getDatabase();
    const now = Date.now();

    const row = await db.getFirstAsync<{ maxIndex: number | null }>(
      'SELECT MAX(pageIndex) as maxIndex FROM pages WHERE bookId = ?;',
      [bookId],
    );
    let nextIndex = (row?.maxIndex ?? -1) + 1;

    await db.withTransactionAsync(async () => {
      for (const input of inputs) {
        await db.runAsync(
          `INSERT INTO pages (id, bookId, pageIndex, imageUri, ocrText, createdAt)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [
            createId(),
            bookId,
            nextIndex,
            input.imageUri,
            input.ocrText ?? null,
            now,
          ],
        );
        nextIndex += 1;
      }
    });

    await bookRepository.syncPageCount(bookId);
  },

  async updateOcrText(pageId: string, ocrText: string | null): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE pages SET ocrText = ? WHERE id = ?;', [
      ocrText,
      pageId,
    ]);
  },

  /** Pages whose text has not been recognised yet. */
  async listPendingOcr(bookId: string): Promise<Page[]> {
    const db = await getDatabase();
    return db.getAllAsync<Page>(
      'SELECT * FROM pages WHERE bookId = ? AND ocrText IS NULL ORDER BY pageIndex ASC;',
      [bookId],
    );
  },

  /** Ids of books that still contain pages waiting for text recognition. */
  async booksWithPendingOcr(): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ bookId: string }>(
      'SELECT DISTINCT bookId FROM pages WHERE ocrText IS NULL;',
    );
    return rows.map((r) => r.bookId);
  },

  /** Marks every page of a book for a fresh text recognition run. */
  async resetOcr(bookId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE pages SET ocrText = NULL WHERE bookId = ?;', [
      bookId,
    ]);
  },

  /** Deletes a page and re-normalises the remaining page indices to 0..n-1. */
  async deletePage(bookId: string, pageId: string): Promise<void> {
    const db = await getDatabase();
    const page = await db.getFirstAsync<{ imageUri: string }>(
      'SELECT imageUri FROM pages WHERE id = ?;',
      [pageId],
    );
    await db.runAsync('DELETE FROM pages WHERE id = ?;', [pageId]);
    await reindexPages(db, bookId);
    await bookRepository.syncPageCount(bookId);

    // Keep the cover valid when it pointed at the deleted page.
    const book = await bookRepository.getById(bookId);
    if (page && book?.coverImageUri === page.imageUri) {
      const first = await this.getByIndex(bookId, 0);
      await bookRepository.update(bookId, { coverImageUri: first?.imageUri ?? null });
    }
    if (page) await imageStorage.remove(page.imageUri).catch(() => {});
  },

  /**
   * Persists a new page order. `orderedPageIds` must contain every page of the
   * book exactly once. Indices are rewritten to match the array order.
   */
  async reorderPages(bookId: string, orderedPageIds: string[]): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      // Offset temporarily to avoid UNIQUE-style collisions during the shuffle.
      const offset = 1_000_000;
      for (let i = 0; i < orderedPageIds.length; i += 1) {
        await db.runAsync(
          'UPDATE pages SET pageIndex = ? WHERE id = ? AND bookId = ?;',
          [i + offset, orderedPageIds[i], bookId],
        );
      }
      for (let i = 0; i < orderedPageIds.length; i += 1) {
        await db.runAsync(
          'UPDATE pages SET pageIndex = ? WHERE id = ? AND bookId = ?;',
          [i, orderedPageIds[i], bookId],
        );
      }
    });
    await bookRepository.syncPageCount(bookId);
  },
};

async function reindexPages(
  db: Awaited<ReturnType<typeof getDatabase>>,
  bookId: string,
): Promise<void> {
  const pages = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM pages WHERE bookId = ? ORDER BY pageIndex ASC;',
    [bookId],
  );
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < pages.length; i += 1) {
      await db.runAsync('UPDATE pages SET pageIndex = ? WHERE id = ?;', [
        i,
        pages[i].id,
      ]);
    }
  });
}
