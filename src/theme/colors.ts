/**
 * Apple-inspired colour tokens.
 *
 * Every semantic colour exists in both a light and a dark variant so the whole
 * UI can switch themes without touching component code. Screens and components
 * should always read from `useTheme().colors` rather than importing these maps
 * directly.
 */

export interface ColorPalette {
  /** App background (behind scrollable content). */
  background: string;
  /** Grouped / secondary background used behind cards. */
  backgroundElevated: string;
  /** Card and sheet surfaces. */
  surface: string;
  /** Pressed / highlighted surface state. */
  surfacePressed: string;

  /** Primary text. */
  text: string;
  /** Secondary text (subtitles, metadata). */
  textSecondary: string;
  /** Tertiary text (captions, disabled). */
  textTertiary: string;

  /** Brand / interactive accent. */
  accent: string;
  /** Accent used on top of filled accent surfaces. */
  onAccent: string;
  /** Subtle accent tint for backgrounds. */
  accentMuted: string;

  /** Destructive actions (delete). */
  danger: string;
  /** Positive state. */
  success: string;

  /** Hairline separators. */
  separator: string;
  /** Input / control borders. */
  border: string;

  /** Skeleton loading base. */
  skeleton: string;

  /** Reader-specific surfaces. */
  readerLight: string;
  readerDark: string;
  readerSepia: string;
}

const light: ColorPalette = {
  background: '#F6F6F4',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfacePressed: '#EFEFEC',

  text: '#1D1D1F',
  textSecondary: '#6E6E73',
  textTertiary: '#A1A1A6',

  accent: '#0A6CFF',
  onAccent: '#FFFFFF',
  accentMuted: 'rgba(10, 108, 255, 0.10)',

  danger: '#E5372C',
  success: '#2DB55D',

  separator: '#E6E6E3',
  border: '#D9D9D5',

  skeleton: '#ECECE9',

  readerLight: '#FFFFFF',
  readerDark: '#1C1C1E',
  readerSepia: '#F8F1E3',
};

const dark: ColorPalette = {
  background: '#000000',
  backgroundElevated: '#1C1C1E',
  surface: '#1C1C1E',
  surfacePressed: '#2C2C2E',

  text: '#FFFFFF',
  textSecondary: '#AEAEB2',
  textTertiary: '#6E6E73',

  accent: '#0A84FF',
  onAccent: '#FFFFFF',
  accentMuted: 'rgba(10, 132, 255, 0.18)',

  danger: '#FF453A',
  success: '#30D158',

  separator: '#38383A',
  border: '#48484A',

  skeleton: '#2C2C2E',

  readerLight: '#FFFFFF',
  readerDark: '#1C1C1E',
  readerSepia: '#3A3428',
};

export const palettes = { light, dark } as const;
