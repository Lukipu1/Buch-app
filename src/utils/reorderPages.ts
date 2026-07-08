import { Page } from '@/types/page';

/**
 * Moves an item within an array to a new position, returning a new array.
 * Generic so it works for both persisted `Page`s and in-flight scan drafts.
 * Out-of-range indices are clamped; the input is never mutated.
 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  if (next.length === 0) return next;
  const src = clamp(from, 0, next.length - 1);
  const dest = clamp(to, 0, next.length - 1);
  if (src === dest) return next;
  const [moved] = next.splice(src, 1);
  next.splice(dest, 0, moved);
  return next;
}

/**
 * Rewrites every page's `pageIndex` to match its position in the array
 * (0..n-1). Call this after any manual reordering so indices stay contiguous.
 */
export function reindexPages(pages: Page[]): Page[] {
  return pages.map((page, index) =>
    page.pageIndex === index ? page : { ...page, pageIndex: index },
  );
}

/**
 * Moves a page from one position to another and recomputes all `pageIndex`
 * values. Returns the reordered, reindexed array (pure).
 */
export function reorderPages(pages: Page[], from: number, to: number): Page[] {
  return reindexPages(moveItem(pages, from, to));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
