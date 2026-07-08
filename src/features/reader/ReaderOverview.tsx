import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/components';
import { useTheme } from '@/theme';
import { Page } from '@/types/models';

interface ReaderOverviewProps {
  pages: Page[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

/** Grid overview of all pages, acting as a simple table of contents. */
export function ReaderOverview({
  pages,
  currentIndex,
  onSelect,
  onClose,
}: ReaderOverviewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Text variant="title3">Seitenübersicht</Text>
          <IconButton icon="close" accessibilityLabel="Schließen" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.grid}>
          {pages.map((page) => {
            const active = page.pageIndex === currentIndex;
            return (
              <Pressable
                key={page.id}
                style={styles.cell}
                onPress={() => onSelect(page.pageIndex)}
              >
                <View
                  style={[
                    styles.thumb,
                    {
                      borderRadius: theme.radius.md,
                      borderColor: active ? theme.colors.accent : 'transparent',
                      ...theme.shadows.sm,
                    },
                  ]}
                >
                  <Image source={{ uri: page.imageUri }} style={styles.image} />
                </View>
                <Text
                  variant="caption"
                  color={active ? 'accent' : 'textTertiary'}
                  center
                  style={styles.label}
                >
                  {page.pageIndex + 1}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  cell: { width: '29%', flexGrow: 1, maxWidth: '31%' },
  thumb: {
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    borderWidth: 2,
  },
  image: { width: '100%', height: '100%' },
  label: { marginTop: 6 },
});
