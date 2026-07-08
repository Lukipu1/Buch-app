import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly, centered placeholder for empty lists and no-result states. */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { padding: theme.spacing.xl }]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.accentMuted,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <Ionicons name={icon} size={34} color={theme.colors.accent} />
      </View>
      <Text variant="title3" center style={styles.title}>
        {title}
      </Text>
      <Text variant="subhead" color="textSecondary" center style={styles.message}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="tinted"
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { marginBottom: 8 },
  message: { maxWidth: 300 },
  action: { marginTop: 24 },
});
