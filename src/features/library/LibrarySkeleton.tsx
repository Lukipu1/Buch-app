import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components';
import { useTheme } from '@/theme';

/** Placeholder grid shown while the library loads. */
export function LibrarySkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.grid, { padding: theme.spacing.lg }]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.cell}>
          <Skeleton height={190} radius={theme.radius.lg} />
          <Skeleton width="80%" height={14} style={styles.line} />
          <Skeleton width="50%" height={12} style={styles.line} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cell: { width: '47%', flexGrow: 1 },
  line: { marginTop: 8 },
});
