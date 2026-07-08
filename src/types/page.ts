/** A single scanned page belonging to a book. Mirrors the `pages` table. */
export interface Page {
  id: string;
  bookId: string;
  pageIndex: number;
  imageUri: string;
  ocrText: string | null;
  createdAt: number;
}

/** A page captured during a scan session, before it is persisted. */
export interface DraftPage {
  id: string;
  imageUri: string;
  ocrText: string | null;
}
