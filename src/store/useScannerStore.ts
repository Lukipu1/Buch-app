import { create } from 'zustand';

import {
  AddPageInput,
  bookRepository,
  pageRepository,
} from '@/services/database';
import { getOcrProvider } from '@/services/ocr';
import { imageStorage } from '@/services/storage/imageStorage';
import { DraftPage } from '@/types/models';
import { createId } from '@/utils/ids';
import { moveItem } from '@/utils/reorderPages';

interface ScannerState {
  /** Pages captured in the current scan session, not yet persisted. */
  drafts: DraftPage[];
  saving: boolean;

  addDraft: (imageUri: string) => void;
  removeDraft: (id: string) => void;
  moveDraft: (from: number, to: number) => void;
  reset: () => void;

  /**
   * Persists the current drafts. When `targetBookId` is provided the pages are
   * appended to that book; otherwise a new book is created with `title`.
   * Returns the id of the affected book.
   */
  commit: (params: {
    targetBookId?: string;
    title?: string;
  }) => Promise<string>;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  drafts: [],
  saving: false,

  addDraft(imageUri) {
    set((s) => ({
      drafts: [...s.drafts, { id: createId(), imageUri, ocrText: null }],
    }));
  },

  removeDraft(id) {
    set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) }));
  },

  moveDraft(from, to) {
    // Reordering drafts before they are persisted; pageIndex is assigned on
    // save based on the final array order. Uses the shared pure `moveItem`.
    set((s) => ({ drafts: moveItem(s.drafts, from, to) }));
  },

  reset() {
    set({ drafts: [], saving: false });
  },

  async commit({ targetBookId, title }) {
    const drafts = get().drafts;
    if (drafts.length === 0) {
      throw new Error('Keine Seiten zum Speichern vorhanden.');
    }
    set({ saving: true });
    try {
      const bookId =
        targetBookId ??
        (await bookRepository.create({ title: title?.trim() || 'Neues Buch' }))
          .id;

      // Persist images into stable storage, running OCR opportunistically.
      const inputs: AddPageInput[] = [];
      const provider = getOcrProvider();
      for (const draft of drafts) {
        const imageUri = await imageStorage.persist(draft.imageUri);
        let ocrText = draft.ocrText;
        if (ocrText === null) {
          try {
            const result = await provider.recognize({ imageUri, language: 'de' });
            ocrText = result.text;
          } catch {
            // OCR is best-effort at scan time; text can be regenerated later.
            ocrText = null;
          }
        }
        inputs.push({ imageUri, ocrText });
      }

      await pageRepository.addPages(bookId, inputs);

      // Use the first scanned page as the cover if the book has none yet.
      const book = await bookRepository.getById(bookId);
      if (book && !book.coverImageUri && inputs[0]) {
        await bookRepository.update(bookId, {
          coverImageUri: inputs[0].imageUri,
        });
      }

      set({ drafts: [], saving: false });
      return bookId;
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
}));
