import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components';
import { useTheme } from '@/theme';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
}

/** A single grouped-list row in the iOS settings style. */
export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  right,
  isLast,
}: SettingsRowProps) {
  const theme = useTheme();

  const content = (
    <View style={styles.row}>
      <View
        style={[
          styles.icon,
          { backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.sm },
        ]}
      >
        <Ionicons name={icon} size={17} color={theme.colors.accent} />
      </View>
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      {value ? (
        <Text variant="body" color="textSecondary" style={styles.value}>
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textTertiary}
          style={styles.chevron}
        />
      )}
    </View>
  );

  return (
    <>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            pressed && { backgroundColor: theme.colors.surfacePressed },
          ]}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      {!isLast && (
        <View
          style={[styles.divider, { backgroundColor: theme.colors.separator }]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 50,
  },
  icon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: { flex: 1 },
  value: { marginRight: 6 },
  chevron: { marginLeft: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
});
