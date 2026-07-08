import * as Haptics from 'expo-haptics';

/**
 * Thin wrapper around expo-haptics. Centralising it here means we can globally
 * disable haptics later (e.g. via a setting) and keeps call sites tidy.
 * Failures are swallowed — haptics are a nicety, never critical.
 */

export const haptic = {
  light() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  success() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  },
  warning() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
  },
  selection() {
    Haptics.selectionAsync().catch(() => {});
  },
};
