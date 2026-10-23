import { create } from 'zustand';

import { bookRepository, pageRepository } from '@/services/database';
import { ProcessedImage } from '@/services/scanner/imageProcessing';
import { imageStorage } from '@/services/storage/imageStorage';
import { DraftPage } from '@/types/models';
import { createId } from '@/utils/ids';

import { useOcrStore } from './useOcrStore';

interface ScannerState {
  /** Pages captured in the current scan session, not yet persisted. */
  drafts: DraftPage[];
  saving: boolean;

  addDrafts: (images: ProcessedImage[]) => void;
  removeDraft: (id: string) => void;
  /** Replaces one draft with one or more images (split, rotate). */
  replaceDraft: (id: string, images: ProcessedImage[]) => void;
  moveDraft: (from: number, to: number) => void;
  reset: () => void;

  /**
   * Persists the current drafts. When `targetBookId` is provided the pages are
   * appended to that book; otherwise a new book is created with `title`.
   * Text recognition is queued in the background. Returns the book id.
   */
  commit: (params: {
    targetBookId?: string;
    title?: string;
    author?: string;
  }) => Promise<string>;
}

function toDraft(image: ProcessedImage): DraftPage {
  return {
    id: createId(),
    imageUri: image.uri,
    width: image.width,
    height: image.height,
    side: image.side,
  };
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  drafts: [],
  saving: false,

  addDrafts(images) {
    if (images.length === 0) return;
    set((s) => ({ drafts: [...s.drafts, ...images.map(toDraft)] }));
  },

  removeDraft(id) {
    set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) }));
  },

  replaceDraft(id, images) {
    set((s) => {
      const index = s.drafts.findIndex((d) => d.id === id);
      if (index === -1) return s;
      const next = [...s.drafts];
      next.splice(index, 1, ...images.map(toDraft));
      return { drafts: next };
    });
  },

  moveDraft(from, to) {
    set((s) => {
      const next = [...s.drafts];
      if (from < 0 || from >= next.length || to < 0 || to >= next.length) {
        return s;
      }
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { drafts: next };
    });
  },

  reset() {
    set({ drafts: [], saving: false });
  },

  async commit({ targetBookId, title, author }) {
    const drafts = get().drafts;
    if (drafts.length === 0) {
      throw new Error('Keine Seiten zum Speichern vorhanden.');
    }
    set({ saving: true });
    try {
      const bookId =
        targetBookId ??
        (
          await bookRepository.create({
            title: title?.trim() || 'Neues Buch',
            author: author?.trim() || null,
          })
        ).id;

      // Move images into stable storage. Text is recognised afterwards.
      const imageUris: string[] = [];
      for (const draft of drafts) {
        imageUris.push(await imageStorage.persist(draft.imageUri));
      }
      await pageRepository.addPages(
        bookId,
        imageUris.map((imageUri) => ({ imageUri, ocrText: null })),
      );

      // Use the first scanned page as the cover if the book has none yet.
      const book = await bookRepository.getById(bookId);
      if (book && !book.coverImageUri && imageUris[0]) {
        await bookRepository.update(bookId, { coverImageUri: imageUris[0] });
      }

      useOcrStore.getState().enqueueBook(bookId);
      set({ drafts: [], saving: false });
      return bookId;
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
}));
