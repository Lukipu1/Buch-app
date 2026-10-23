/** A single scanned page belonging to a book. Mirrors the `pages` table. */
export interface Page {
  id: string;
  bookId: string;
  pageIndex: number;
  imageUri: string;
  /** Recognised text. `null` = not processed yet, `''` = processed, no text. */
  ocrText: string | null;
  createdAt: number;
}

/** Which half of a double-page spread an image came from. */
export type PageSide = 'single' | 'left' | 'right';

/** A page captured during a scan session, before it is persisted. */
export interface DraftPage {
  id: string;
  imageUri: string;
  width?: number;
  height?: number;
  side: PageSide;
}
