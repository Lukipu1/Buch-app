/** Small, dependency-free formatting helpers used across screens. */

/** Formats a page count as a localized German label. */
export function formatPageCount(count: number): string {
  return count === 1 ? '1 Seite' : `${count} Seiten`;
}

/** Reading progress as a 0–1 fraction. */
export function readingProgress(
  currentPageIndex: number,
  totalPages: number,
): number {
  if (totalPages <= 0) return 0;
  // currentPageIndex is zero-based; a book on its last page is "complete".
  const pagesRead = Math.min(currentPageIndex + 1, totalPages);
  return pagesRead / totalPages;
}

/** Reading progress as a rounded percentage string, e.g. "42 %". */
export function formatProgress(
  currentPageIndex: number,
  totalPages: number,
): string {
  const pct = Math.round(readingProgress(currentPageIndex, totalPages) * 100);
  return `${pct} %`;
}

/** Relative "last opened" label in German (e.g. "vor 3 Tagen"). */
export function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Noch nicht geöffnet';

  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Gerade eben';
  if (diff < hour) {
    const m = Math.floor(diff / minute);
    return `vor ${m} Min.`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return h === 1 ? 'vor 1 Stunde' : `vor ${h} Stunden`;
  }
  const d = Math.floor(diff / day);
  if (d === 1) return 'Gestern';
  if (d < 7) return `vor ${d} Tagen`;

  return new Date(timestamp).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
