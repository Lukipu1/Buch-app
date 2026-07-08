import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useTheme } from '@/theme';
import { LibrarySort } from '@/types/models';

const OPTIONS: { key: LibrarySort; label: string }[] = [
  { key: 'recentlyAdded', label: 'Zuletzt hinzugefügt' },
  { key: 'recentlyOpened', label: 'Zuletzt gelesen' },
  { key: 'title', label: 'Titel' },
];

/** Horizontal segmented chips controlling the library sort order. */
export function SortControl() {
  const theme = useTheme();
  const sort = useLibraryStore((s) => s.sort);
  const setSort = useLibraryStore((s) => s.setSort);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((option) => {
        const active = option.key === sort;
        return (
          <Pressable
            key={option.key}
            onPress={() => setSort(option.key)}
            style={[
              styles.chip,
              {
                backgroundColor: active
                  ? theme.colors.accent
                  : theme.colors.surface,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <Text
              variant="footnote"
              style={{
                color: active ? theme.colors.onAccent : theme.colors.textSecondary,
                fontWeight: active ? '600' : '400',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8 },
});
