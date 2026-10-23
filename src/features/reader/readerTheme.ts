import { Platform, TextStyle } from 'react-native';

import {
  ReaderFont,
  ReaderMargin,
  ReaderSpacing,
  ReaderTheme,
} from '@/types/models';

export interface ReaderColors {
  background: string;
  /** Bars and panels drawn on top of the page. */
  chrome: string;
  text: string;
  muted: string;
  separator: string;
  accent: string;
  isDark: boolean;
}

export const READER_THEMES: Record<ReaderTheme, ReaderColors & { label: string }> = {
  light: {
    label: 'Weiß',
    background: '#FFFFFF',
    chrome: '#FFFFFF',
    text: '#1A1A1A',
    muted: '#8A8A8E',
    separator: 'rgba(0,0,0,0.08)',
    accent: '#0A6CFF',
    isDark: false,
  },
  sepia: {
    label: 'Sepia',
    background: '#F8F1E3',
    chrome: '#F3EAD7',
    text: '#3B2F22',
    muted: '#8C7B66',
    separator: 'rgba(59,47,34,0.12)',
    accent: '#A0642A',
    isDark: false,
  },
  green: {
    label: 'Grün',
    background: '#E6F0E3',
    chrome: '#DCE9D8',
    text: '#1F2D21',
    muted: '#6A7D6C',
    separator: 'rgba(31,45,33,0.12)',
    accent: '#2F7D4A',
    isDark: false,
  },
  dark: {
    label: 'Dunkel',
    background: '#1C1C1E',
    chrome: '#242426',
    text: '#E5E5E7',
    muted: '#8E8E93',
    separator: 'rgba(255,255,255,0.1)',
    accent: '#5AA2FF',
    isDark: true,
  },
  black: {
    label: 'Schwarz',
    background: '#000000',
    chrome: '#111111',
    text: '#D4D4D4',
    muted: '#7A7A7A',
    separator: 'rgba(255,255,255,0.1)',
    accent: '#5AA2FF',
    isDark: true,
  },
};

export const READER_THEME_ORDER: ReaderTheme[] = ['light', 'sepia', 'green', 'dark', 'black'];

export function readerColors(theme: ReaderTheme): ReaderColors {
  return READER_THEMES[theme] ?? READER_THEMES.light;
}

interface FontOption {
  key: ReaderFont;
  label: string;
  family: string | undefined;
}

/** Typefaces offered in the reader. Android only ships serif + sans. */
export const READER_FONTS: FontOption[] = Platform.select<FontOption[]>({
  ios: [
    { key: 'georgia', label: 'Georgia', family: 'Georgia' },
    { key: 'palatino', label: 'Palatino', family: 'Palatino' },
    { key: 'iowan', label: 'Iowan', family: 'Iowan Old Style' },
    { key: 'system', label: 'Modern', family: undefined },
  ],
  android: [
    { key: 'georgia', label: 'Serif', family: 'serif' },
    { key: 'system', label: 'Modern', family: 'sans-serif' },
  ],
  default: [
    { key: 'georgia', label: 'Serif', family: 'Georgia, serif' },
    { key: 'system', label: 'Modern', family: undefined },
  ],
})!;

export function fontFamilyFor(font: ReaderFont): string | undefined {
  return (READER_FONTS.find((f) => f.key === font) ?? READER_FONTS[0]).family;
}

export const READER_SPACING: Record<ReaderSpacing, number> = {
  compact: 1.35,
  normal: 1.55,
  relaxed: 1.8,
};

export const READER_MARGINS: Record<ReaderMargin, number> = {
  narrow: 18,
  normal: 30,
  wide: 46,
};

export const READER_FONT_MIN = 13;
export const READER_FONT_MAX = 32;

export interface ReaderTypography {
  fontSize: number;
  lineHeight: number;
  fontFamily: string | undefined;
  justify: boolean;
  color: string;
}

export function readerTextStyle(t: ReaderTypography): TextStyle {
  return {
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    fontFamily: t.fontFamily,
    color: t.color,
    textAlign: t.justify ? 'justify' : 'left',
    letterSpacing: 0,
  };
}
