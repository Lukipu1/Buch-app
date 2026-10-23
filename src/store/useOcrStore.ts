import { create } from 'zustand';

import { pageRepository } from '@/services/database';
import { OcrError, getOcrProvider, isOcrAvailable } from '@/services/ocr';

import { useSettingsStore } from './useSettingsStore';

export interface OcrJob {
  done: number;
  total: number;
}

interface OcrState {
  /** Running / queued jobs keyed by book id. */
  jobs: Record<string, OcrJob>;
  /** Incremented per book whenever new text was stored — screens reload on change. */
  versions: Record<string, number>;

  /** Recognises every page of the book that has no text yet. */
  enqueueBook: (bookId: string) => void;
  /** Picks up unfinished work after an app restart. */
  resumePending: () => Promise<void>;
}

const queue: string[] = [];
let running = false;

/**
 * Background text recognition. Scans are saved instantly; this queue then
 * processes pages one by one so the UI never blocks on OCR.
 */
export const useOcrStore = create<OcrState>((set, get) => {
  const bump = (bookId: string) =>
    set((s) => ({ versions: { ...s.versions, [bookId]: (s.versions[bookId] ?? 0) + 1 } }));

  const setJob = (bookId: string, job: OcrJob | null) =>
    set((s) => {
      const jobs = { ...s.jobs };
      if (job) jobs[bookId] = job;
      else delete jobs[bookId];
      return { jobs };
    });

  async function processBook(bookId: string) {
    const pending = await pageRepository.listPendingOcr(bookId);
    if (pending.length === 0) return;
    setJob(bookId, { done: 0, total: pending.length });

    const provider = getOcrProvider();
    const language = useSettingsStore.getState().settings.ocrLanguage;

    for (let i = 0; i < pending.length; i += 1) {
      const page = pending[i];
      try {
        const result = await provider.recognize({ imageUri: page.imageUri, language });
        await pageRepository.updateOcrText(page.id, result.text);
      } catch (error) {
        if (error instanceof OcrError && error.code === 'unsupported') break;
        // Mark as processed so a broken image doesn't loop forever.
        await pageRepository.updateOcrText(page.id, '').catch(() => {});
      }
      setJob(bookId, { done: i + 1, total: pending.length });
      // Let the reader pick up text progressively on larger books.
      if ((i + 1) % 5 === 0) bump(bookId);
    }
    bump(bookId);
  }

  async function run() {
    if (running) return;
    running = true;
    try {
      while (queue.length > 0) {
        const bookId = queue[0];
        try {
          await processBook(bookId);
        } catch {
          // Database errors: skip this book, keep the queue alive.
        }
        queue.shift();
        setJob(bookId, null);
      }
    } finally {
      running = false;
    }
  }

  return {
    jobs: {},
    versions: {},

    enqueueBook(bookId) {
      if (!isOcrAvailable()) return;
      if (!queue.includes(bookId)) queue.push(bookId);
      if (!get().jobs[bookId]) setJob(bookId, { done: 0, total: 0 });
      void run();
    },

    async resumePending() {
      if (!isOcrAvailable()) return;
      const ids = await pageRepository.booksWithPendingOcr();
      ids.forEach((id) => get().enqueueBook(id));
    },
  };
});
