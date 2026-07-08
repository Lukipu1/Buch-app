import { Page } from '@/types/page';
import { PageSortKey } from '@/types/sort';

/**
 * Returns a new array of pages ordered by the given sort key. Pure — the input
 * is not mutated. Ties fall back to `pageIndex` so the order stays stable.
 */
export function sortPages(pages: Page[], key: PageSortKey): Page[] {
  const copy = [...pages];
  switch (key) {
    case 'indexAsc':
      copy.sort((a, b) => a.pageIndex - b.pageIndex);
      break;
    case 'indexDesc':
      copy.sort((a, b) => b.pageIndex - a.pageIndex);
      break;
    case 'createdAsc':
      copy.sort((a, b) => a.createdAt - b.createdAt || a.pageIndex - b.pageIndex);
      break;
    case 'createdDesc':
      copy.sort((a, b) => b.createdAt - a.createdAt || a.pageIndex - b.pageIndex);
      break;
  }
  return copy;
}
