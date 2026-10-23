import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, IconButton, SegmentedControl, Text } from '@/components';
import { useTheme } from '@/theme';
import { Bookmark, Page } from '@/types/models';
import { formatRelativeTime } from '@/utils/date';

interface ReaderContentsSheetProps {
  pages: Page[];
  currentPageIdx: number;
  bookmarks: Bookmark[];
  onSelectPage: (pageIdx: number) => void;
  onSelectBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
  onClose: () => void;
}

type Tab = 'pages' | 'bookmarks';

/** Page overview and bookmark list. */
export function ReaderContentsSheet({
  pages,
  currentPageIdx,
  bookmarks,
  onSelectPage,
  onSelectBookmark,
  onDeleteBookmark,
  onClose,
}: ReaderContentsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('pages');
  // Row height of the 3-column grid: thumbnail (3:4) + label + gap.
  const cellWidth = (width - 32 - 28) / 3;
  const rowHeight = cellWidth * (4 / 3) + 20 + 14;
  const pageNumber = new Map(pages.map((p, i) => [p.id, i + 1]));

  return (
    <Modal
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.flex,
          {
            backgroundColor: theme.colors.background,
            paddingTop: Platform.OS === 'ios' ? 8 : insets.top,
          },
        ]}
      >
        <View style={styles.header}>
          <Text variant="title3">Inhalt</Text>
          <IconButton icon="close" accessibilityLabel="Schließen" onPress={onClose} tinted />
        </View>
        <View style={styles.tabs}>
          <SegmentedControl
            segments={[
              { value: 'pages', label: `Seiten (${pages.length})` },
              { value: 'bookmarks', label: `Lesezeichen (${bookmarks.length})` },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        {tab === 'pages' ? (
          <FlatList
            data={pages}
            keyExtractor={(p) => p.id}
            numColumns={3}
            initialScrollIndex={Math.floor(currentPageIdx / 3)}
            getItemLayout={(_, row) => ({
              length: rowHeight,
              offset: 4 + rowHeight * row,
              index: row,
            })}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
            renderItem={({ item, index }) => {
              const active = index === currentPageIdx;
              return (
                <Pressable style={{ width: cellWidth }} onPress={() => onSelectPage(index)}>
                  <View
                    style={[
                      styles.thumb,
                      {
                        borderRadius: theme.radius.sm,
                        borderColor: active ? theme.colors.accent : 'transparent',
                        backgroundColor: theme.colors.surface,
                        ...theme.shadows.sm,
                      },
                    ]}
                  >
                    <Image source={{ uri: item.imageUri }} style={styles.image} />
                  </View>
                  <Text
                    variant="caption"
                    color={active ? 'accent' : 'textSecondary'}
                    center
                    style={styles.pageLabel}
                  >
                    {index + 1}
                  </Text>
                </Pressable>
              );
            }}
          />
        ) : bookmarks.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title="Keine Lesezeichen"
            message="Tippe beim Lesen oben rechts auf das Lesezeichen-Symbol, um eine Stelle zu merken."
          />
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(b) => b.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelectBookmark(item)}
                style={({ pressed }) => [
                  styles.bookmark,
                  { backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface },
                ]}
              >
                <Ionicons name="bookmark" size={18} color={theme.colors.danger} />
                <View style={styles.bookmarkText}>
                  <Text variant="subhead" style={styles.bookmarkTitle}>
                    Seite {pageNumber.get(item.pageId) ?? '–'}
                    <Text variant="footnote" color="textTertiary">
                      {'  '}
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </Text>
                  {item.snippet ? (
                    <Text variant="footnote" color="textSecondary" numberOfLines={2}>
                      {item.snippet}
                    </Text>
                  ) : null}
                </View>
                <IconButton
                  icon="trash-outline"
                  accessibilityLabel="Lesezeichen löschen"
                  onPress={() => onDeleteBookmark(item)}
                  color={theme.colors.textTertiary}
                  size={18}
                />
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabs: { paddingHorizontal: 16, paddingBottom: 12 },
  grid: { paddingHorizontal: 16, paddingTop: 4 },
  row: { gap: 14, marginBottom: 14 },
  thumb: { aspectRatio: 3 / 4, overflow: 'hidden', borderWidth: 2 },
  image: { width: '100%', height: '100%' },
  pageLabel: { marginTop: 4 },
  list: { paddingHorizontal: 16 },
  bookmark: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookmarkText: { flex: 1, marginLeft: 12 },
  bookmarkTitle: { fontWeight: '600', marginBottom: 2 },
  separator: { height: 8, backgroundColor: 'transparent' },
});
