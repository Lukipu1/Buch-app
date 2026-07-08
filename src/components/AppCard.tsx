import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle;
}

/** Rounded, softly shadowed surface used to group content. */
export function AppCard({ children, onPress, padded = true, style }: AppCardProps) {
  const theme = useTheme();

  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: padded ? theme.spacing.lg : 0,
    ...theme.shadows.sm,
  };

  if (!onPress) {
    return <View style={[base, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [
        base,
        pressed && { backgroundColor: theme.colors.surfacePressed },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
