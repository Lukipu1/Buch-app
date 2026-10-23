/** Small, dependency-free formatting helpers used across screens. */

// Re-exported so callers can pull date + value formatting from one module.
export { formatRelativeTime, formatDate, formatDuration } from './date';

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
