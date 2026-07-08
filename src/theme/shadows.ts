import { Platform, ViewStyle } from 'react-native';

type ShadowToken = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/**
 * Soft, diffuse shadows. iOS uses the shadow* props; Android falls back to
 * elevation. Opacities stay low to keep the premium, understated feel.
 */
function make(
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ShadowToken {
  return Platform.select<ShadowToken>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  })!;
}

export const shadows = {
  none: make(0, 0, 0, 0),
  sm: make(1, 3, 0.06, 2),
  md: make(4, 12, 0.08, 4),
  lg: make(8, 24, 0.12, 8),
} as const;

export type ShadowKey = keyof typeof shadows;
