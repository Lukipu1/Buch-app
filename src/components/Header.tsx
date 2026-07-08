import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Rendered on the trailing edge (e.g. an action button). */
  right?: React.ReactNode;
  /** Rendered on the leading edge (e.g. a back button). */
  left?: React.ReactNode;
}

/**
 * Large-title screen header in the iOS style. Screens that use the native
 * navigator title can skip this; it is handy for custom/modal screens.
 */
export function Header({ title, subtitle, right, left }: HeaderProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { paddingHorizontal: theme.spacing.lg }]}>
      <View style={styles.row}>
        {left}
        <View style={styles.titles}>
          <Text variant="largeTitle">{title}</Text>
          {subtitle && (
            <Text variant="subhead" color="textSecondary" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1 },
  subtitle: { marginTop: 2 },
});
