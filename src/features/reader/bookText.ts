import { joinLines } from '@/services/ocr/textAssembly';

export { formatDuration } from '@/utils/date';

/**
 * Builds one continuous reading text out of the recognised page texts, the
 * way an e-reader flows a book: sentences that run across a page break are
 * joined (including hyphenated words), paragraphs get a first-line indent.
 */

export const INDENT = ' ';

const SENTENCE_END = /[.!?…:;"»«“”)\]]$/;
const HYPHEN_END = /[\p{L}]-$/u;
const LOWER_START = /^\p{Ll}/u;

export interface BookStream {
  text: string;
  /** Offset where each page's text starts, in page order. */
  pageStarts: number[];
  /** Offset where each page's text ends (exclusive). Equal to start when empty. */
  pageEnds: number[];
}

/** Splits stored OCR text into clean single-line paragraphs. */
export function toParagraphs(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .reduce((acc, line) => (acc ? joinLines(acc, line) : line), ''),
    )
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export function buildBookStream(pages: { ocrText: string | null }[]): BookStream {
  let text = '';
  const pageStarts: number[] = [];
  const pageEnds: number[] = [];

  for (const page of pages) {
    const paragraphs = toParagraphs(page.ocrText ?? '');
    if (paragraphs.length === 0) {
      pageStarts.push(text.length);
      pageEnds.push(text.length);
      continue;
    }

    const [first, ...rest] = paragraphs;
    let start: number;
    if (text.length === 0) {
      start = 0;
      text = first;
    } else if (HYPHEN_END.test(text) && LOWER_START.test(first)) {
      // "Buch-" | "seite" → "Buchseite"
      text = text.slice(0, -1);
      start = text.length;
      // Keep earlier page boundaries inside the shortened text.
      for (let i = 0; i < pageEnds.length; i += 1) {
        pageStarts[i] = Math.min(pageStarts[i], start);
        pageEnds[i] = Math.min(pageEnds[i], start);
      }
      text += first;
    } else if (!SENTENCE_END.test(text) && LOWER_START.test(first)) {
      // Sentence continues on the next page.
      text += ' ';
      start = text.length;
      text += first;
    } else {
      text += '\n';
      start = text.length;
      text += INDENT + first;
    }
    for (const paragraph of rest) {
      text += `\n${INDENT}${paragraph}`;
    }
    pageStarts.push(start);
    pageEnds.push(text.length);
  }

  return { text, pageStarts, pageEnds };
}

/** Index of the page whose text contains `offset` (last non-empty page before it). */
export function pageIndexForOffset(stream: BookStream, offset: number): number {
  const { pageStarts, pageEnds } = stream;
  let lo = 0;
  let hi = pageStarts.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (pageStarts[mid] <= offset) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  // Skip back over empty pages that share the same start offset.
  while (found > 0 && pageEnds[found] === pageStarts[found] && pageStarts[found] >= offset) {
    found -= 1;
  }
  return found;
}

/** Global offset for a position given as page index + offset inside that page. */
export function globalOffset(stream: BookStream, pageIdx: number, local: number): number {
  if (stream.pageStarts.length === 0) return 0;
  const idx = Math.max(0, Math.min(pageIdx, stream.pageStarts.length - 1));
  const start = stream.pageStarts[idx];
  const end = stream.pageEnds[idx];
  return Math.max(start, Math.min(start + Math.max(0, local), Math.max(start, end - 1)));
}

export interface TextRange {
  start: number;
  end: number;
}

/** Index of the paginated screen page containing `offset`. */
export function rangeIndexForOffset(ranges: TextRange[], offset: number): number {
  let lo = 0;
  let hi = ranges.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ranges[mid].start <= offset) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

export interface StreamMatch {
  offset: number;
  snippet: string;
  /** Position of the match inside `snippet`. */
  matchStart: number;
  matchLength: number;
}

/** Case-insensitive full-text search inside the book. */
export function searchStream(text: string, rawQuery: string, limit = 100): StreamMatch[] {
  const query = rawQuery.trim().toLocaleLowerCase('de-DE');
  if (query.length < 2) return [];
  const haystack = text.toLocaleLowerCase('de-DE');
  const results: StreamMatch[] = [];
  let from = 0;
  while (results.length < limit) {
    const idx = haystack.indexOf(query, from);
    if (idx === -1) break;
    const start = Math.max(0, idx - 50);
    const end = Math.min(text.length, idx + query.length + 70);
    const prefix = start > 0 ? '…' : '';
    const raw = text.slice(start, end).replace(/\s+/g, ' ');
    results.push({
      offset: idx,
      snippet: `${prefix}${raw}${end < text.length ? '…' : ''}`,
      matchStart: prefix.length + text.slice(start, idx).replace(/\s+/g, ' ').length,
      matchLength: query.length,
    });
    from = idx + query.length;
  }
  return results;
}

/** Roughly 6.5 characters per word and 220 words per minute. */
const CHARS_PER_MINUTE = 6.5 * 220;

export function readingMinutes(chars: number): number {
  return chars / CHARS_PER_MINUTE;
}
