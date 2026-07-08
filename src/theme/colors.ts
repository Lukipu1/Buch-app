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
  background: '#F2F2F7',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfacePressed: '#EBEBF0',

  text: '#1C1C1E',
  textSecondary: '#6E6E73',
  textTertiary: '#A1A1A6',

  accent: '#007AFF',
  onAccent: '#FFFFFF',
  accentMuted: 'rgba(0, 122, 255, 0.12)',

  danger: '#FF3B30',
  success: '#34C759',

  separator: '#E5E5EA',
  border: '#D1D1D6',

  skeleton: '#E9E9EE',

  readerLight: '#FFFFFF',
  readerDark: '#1C1C1E',
  readerSepia: '#FBF0D9',
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
