import { Theme } from '@/theme';

export type ReaderAppearance = 'light' | 'sepia' | 'dark';

export interface ReaderColors {
  background: string;
  text: string;
  muted: string;
}

/** Maps a reading appearance to concrete background/text colours. */
export function readerColors(
  appearance: ReaderAppearance,
  theme: Theme,
): ReaderColors {
  switch (appearance) {
    case 'sepia':
      return {
        background: theme.colors.readerSepia,
        text: theme.scheme === 'dark' ? '#E8DFC8' : '#3A2E1A',
        muted: theme.scheme === 'dark' ? '#B8AC8E' : '#7A6A4C',
      };
    case 'dark':
      return { background: theme.colors.readerDark, text: '#EDEDED', muted: '#9A9A9A' };
    case 'light':
    default:
      return { background: theme.colors.readerLight, text: '#1C1C1E', muted: '#8E8E93' };
  }
}

export const READER_FONT_MIN = 14;
export const READER_FONT_MAX = 28;
