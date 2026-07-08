import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';

interface SettingsSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

/** Grouped card container with an optional caption and footer note. */
export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {title && (
        <Text variant="footnote" color="textSecondary" style={styles.title}>
          {title.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        {children}
      </View>
      {footer && (
        <Text variant="caption" color="textTertiary" style={styles.footer}>
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  title: { marginBottom: 8, marginLeft: 16 },
  card: { overflow: 'hidden' },
  footer: { marginTop: 8, marginHorizontal: 16, lineHeight: 17 },
});
