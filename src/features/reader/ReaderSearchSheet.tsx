import React, { useMemo, useState } from 'react';
import { FlatList, Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, IconButton, SearchInput, Text } from '@/components';
import { useTheme } from '@/theme';

import { BookStream, StreamMatch, pageIndexForOffset, searchStream } from './bookText';

interface ReaderSearchSheetProps {
  stream: BookStream;
  onSelect: (match: StreamMatch) => void;
  onClose: () => void;
}

/** Full-text search inside the open book. */
export function ReaderSearchSheet({ stream, onSelect, onClose }: ReaderSearchSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchStream(stream.text, query), [stream.text, query]);
  const hasText = stream.text.trim().length > 0;

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
          <Text variant="title3">Im Buch suchen</Text>
          <IconButton icon="close" accessibilityLabel="Schließen" onPress={onClose} tinted />
        </View>
        <View style={styles.field}>
          <SearchInput
            placeholder="Wort oder Satz"
            value={query}
            onChangeText={setQuery}
            autoFocus={hasText}
          />
        </View>

        {!hasText ? (
          <EmptyState
            icon="document-text-outline"
            title="Kein Text verfügbar"
            message="Sobald der Text der Seiten erkannt wurde, kannst du hier suchen."
          />
        ) : query.trim().length < 2 ? (
          <EmptyState
            icon="search-outline"
            title="Durchsuche dieses Buch"
            message="Gib mindestens zwei Zeichen ein."
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon="file-tray-outline"
            title="Keine Treffer"
            message={`„${query.trim()}“ kommt in diesem Buch nicht vor.`}
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(r) => String(r.offset)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            ListHeaderComponent={
              <Text variant="footnote" color="textTertiary" style={styles.count}>
                {results.length >= 100 ? '100+' : results.length} Treffer
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  onSelect(item);
                }}
                style={({ pressed }) => [
                  styles.result,
                  {
                    backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Text variant="footnote" color="accent" style={styles.page}>
                  Seite {pageIndexForOffset(stream, item.offset) + 1}
                </Text>
                <Text variant="subhead" color="textSecondary" numberOfLines={3}>
                  {item.snippet.slice(0, item.matchStart)}
                  <Text variant="subhead" style={styles.match}>
                    {item.snippet.slice(item.matchStart, item.matchStart + item.matchLength)}
                  </Text>
                  {item.snippet.slice(item.matchStart + item.matchLength)}
                </Text>
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
  field: { paddingHorizontal: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, gap: 8 },
  count: { marginVertical: 6, marginLeft: 4 },
  result: { padding: 14 },
  page: { marginBottom: 4, fontWeight: '600' },
  match: { fontWeight: '700' },
});
