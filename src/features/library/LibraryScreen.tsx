import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BookCard,
  EmptyState,
  AppHeader,
  IconButton,
  SearchInput,
} from '@/components';
import { useLibraryStore, selectVisibleBooks } from '@/store/useLibraryStore';
import { useTheme } from '@/theme';

import { LibrarySkeleton } from './LibrarySkeleton';
import { SortControl } from './SortControl';

export function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const status = useLibraryStore((s) => s.status);
  const query = useLibraryStore((s) => s.query);
  const setQuery = useLibraryStore((s) => s.setQuery);
  const load = useLibraryStore((s) => s.load);
  const refresh = useLibraryStore((s) => s.refresh);
  const books = useLibraryStore(selectVisibleBooks);
  const totalBooks = useLibraryStore((s) => s.books.length);

  useEffect(() => {
    void load();
  }, [load]);

  const openBook = useCallback(
    (id: string) => router.push(`/book/${id}`),
    [router],
  );

  const startScan = useCallback(() => router.push('/scanner'), [router]);

  const showEmpty = status === 'ready' && totalBooks === 0;
  const showNoResults = status === 'ready' && totalBooks > 0 && books.length === 0;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <AppHeader
          title="Bibliothek"
          right={
            <View style={styles.headerActions}>
              <IconButton
                icon="search"
                accessibilityLabel="Suche öffnen"
                onPress={() => router.push('/search')}
              />
              <IconButton
                icon="settings-outline"
                accessibilityLabel="Einstellungen öffnen"
                onPress={() => router.push('/settings')}
              />
              <IconButton
                icon="add"
                accessibilityLabel="Neues Buch scannen"
                onPress={startScan}
                tinted
              />
            </View>
          }
        />
        {totalBooks > 0 && (
          <View style={styles.controls}>
            <SearchInput
              placeholder="Bücher durchsuchen"
              value={query}
              onChangeText={setQuery}
            />
            <SortControl />
          </View>
        )}
      </View>

      {status === 'loading' && <LibrarySkeleton />}

      {showEmpty && (
        <EmptyState
          icon="library-outline"
          title="Deine Bibliothek ist leer"
          message="Scanne dein erstes Buch, um es hier zu sehen. Seiten werden automatisch organisiert."
          actionLabel="Buch scannen"
          onAction={startScan}
        />
      )}

      {showNoResults && (
        <EmptyState
          icon="search-outline"
          title="Keine Treffer"
          message={`Für „${query}“ wurde kein Buch gefunden.`}
        />
      )}

      {status === 'ready' && books.length > 0 && (
        <ScrollView
          contentContainerStyle={[
            styles.grid,
            { padding: theme.spacing.lg, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
          }
        >
          {books.map((book) => (
            <View key={book.id} style={styles.cell}>
              <BookCard book={book} onPress={() => openBook(book.id)} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  controls: { paddingHorizontal: 16, gap: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cell: { width: '47%', flexGrow: 1 },
});
