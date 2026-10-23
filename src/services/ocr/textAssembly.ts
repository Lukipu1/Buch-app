/**
 * Turns positioned OCR lines into clean reading text.
 *
 * OCR engines return lines with bounding boxes but no paragraph structure.
 * For a Kindle-like reflowed text view we need real paragraphs, so this module
 * merges lines into rows, removes page furniture (page numbers, running
 * headers), detects paragraph breaks from gaps/indents and joins hyphenated
 * words. It is pure and platform-independent.
 */

export interface PositionedLine {
  text: string;
  /** Normalised 0–1, top-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Row {
  text: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  height: number;
}

const PAGE_NUMBER = /^[\s\-–—·•]*\d{1,4}[\s\-–—·•]*$/;
const SENTENCE_END = /[.!?…:;"»«“”)\]]$/;
const HYPHEN_END = /[\p{L}]-$/u;
const LOWER_START = /^\p{Ll}/u;

export function assembleText(input: PositionedLine[]): string {
  const lines = input
    .map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.text.length > 0);
  if (lines.length === 0) return '';

  const rows = removeFurniture(mergeRows(lines));
  if (rows.length === 0) return '';

  const heights = rows.map((r) => r.height);
  const lineHeight = median(heights);
  const bodyLeft = percentile(rows.map((r) => r.left), 0.2);
  const bodyRight = percentile(rows.map((r) => r.right), 0.8);
  const bodyWidth = Math.max(0.05, bodyRight - bodyLeft);
  const indentThreshold = Math.max(0.02, bodyWidth * 0.03);

  const paragraphs: string[] = [];
  let current = rows[0].text;

  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1];
    const row = rows[i];

    const gap = row.top - prev.bottom;
    const isIndented = row.left - bodyLeft > indentThreshold;
    const prevShort = prev.right < bodyRight - bodyWidth * 0.12;
    const prevDisplaced =
      prev.left - bodyLeft > indentThreshold && prev.right < bodyRight - bodyWidth * 0.05;
    const prevIsHeading = prevDisplaced && !SENTENCE_END.test(prev.text);

    const newParagraph =
      gap > lineHeight * 0.9 ||
      (isIndented && !LOWER_START.test(row.text)) ||
      (prevShort && SENTENCE_END.test(prev.text)) ||
      prevIsHeading;

    if (newParagraph) {
      paragraphs.push(current);
      current = row.text;
    } else {
      current = joinLines(current, row.text);
    }
  }
  paragraphs.push(current);

  return paragraphs
    .map((p) => p.trim())
    .filter(Boolean)
    .join('\n\n');
}

/** Joins two consecutive lines, removing end-of-line hyphenation. */
export function joinLines(a: string, b: string): string {
  if (HYPHEN_END.test(a) && LOWER_START.test(b)) {
    return a.slice(0, -1) + b;
  }
  return `${a} ${b}`;
}

/** Lines that overlap vertically belong to the same visual row. */
function mergeRows(lines: PositionedLine[]): Row[] {
  const sorted = [...lines].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: { items: PositionedLine[]; top: number; bottom: number }[] = [];

  for (const line of sorted) {
    const top = line.y;
    const bottom = line.y + line.height;
    const row = rows[rows.length - 1];
    if (row) {
      const overlap = Math.min(bottom, row.bottom) - Math.max(top, row.top);
      const minHeight = Math.min(line.height, row.bottom - row.top);
      if (minHeight > 0 && overlap / minHeight > 0.5) {
        row.items.push(line);
        row.top = Math.min(row.top, top);
        row.bottom = Math.max(row.bottom, bottom);
        continue;
      }
    }
    rows.push({ items: [line], top, bottom });
  }

  return rows.map((row) => {
    const items = row.items.sort((a, b) => a.x - b.x);
    return {
      text: items.map((i) => i.text).join(' '),
      left: Math.min(...items.map((i) => i.x)),
      right: Math.max(...items.map((i) => i.x + i.width)),
      top: row.top,
      bottom: row.bottom,
      height: row.bottom - row.top,
    };
  });
}

/** Drops page numbers and running headers/footers near the page edges. */
function removeFurniture(rows: Row[]): Row[] {
  if (rows.length < 2) return rows.filter((r) => !PAGE_NUMBER.test(r.text));
  const lineHeight = median(rows.map((r) => r.height));

  return rows.filter((row, index) => {
    const nearTop = row.top < 0.1;
    const nearBottom = row.bottom > 0.9;
    if ((nearTop || nearBottom) && PAGE_NUMBER.test(row.text)) return false;

    // A short, isolated first line is almost always a running header.
    if (index === 0 && nearTop && row.text.length < 60) {
      const next = rows[1];
      if (next && next.top - row.bottom > lineHeight * 1.8) return false;
    }
    // Same for a short, isolated last line (footer).
    if (index === rows.length - 1 && nearBottom && row.text.length < 40) {
      const prev = rows[index - 1];
      if (prev && row.top - prev.bottom > lineHeight * 1.8) return false;
    }
    return true;
  });
}

function median(values: number[]): number {
  return percentile(values, 0.5);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}
