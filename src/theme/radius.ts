/** Corner radius tokens — soft, rounded, Apple-like. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radius;
