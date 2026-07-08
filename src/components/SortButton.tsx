import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

import { Text } from './Text';

interface SortButtonProps {
  /** Current sort label, shown next to the icon. */
  label: string;
  onPress: () => void;
  /** Compact variant shows only the icon (for tight toolbars). */
  compact?: boolean;
}

/** Pill button that opens a `SortSheet`; displays the active sort label. */
export function SortButton({ label, onPress, compact }: SortButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sortierung: ${label}`}
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.pill,
          borderColor: theme.colors.separator,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name="swap-vertical" size={16} color={theme.colors.accent} />
      {!compact && (
        <Text variant="footnote" color="accent" style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { marginLeft: 6 },
});
