import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Header, Input, Text } from '@/components';
import { useTheme } from '@/theme';

import { SearchResultCard } from './SearchResultCard';
import { useSearch } from './useSearch';

export function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { query, setQuery, results, status } = useSearch();

  const openBook = (id: string) => {
    Keyboard.dismiss();
    router.push(`/book/${id}`);
  };
  const openPage = (id: string, pageIndex: number) => {
    Keyboard.dismiss();
    router.push(`/reader/${id}?page=${pageIndex}`);
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <Header title="Suche" />
        <View style={styles.searchField}>
          <Input
            icon="search"
            placeholder="Titel, Autor oder Inhalt"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {status === 'idle' && (
        <EmptyState
          icon="search-outline"
          title="Durchsuche deine Bücher"
          message="Finde Bücher anhand von Titel, Autor oder erkanntem Seitentext."
        />
      )}

      {status === 'searching' && (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      )}

      {status === 'done' && results.length === 0 && (
        <EmptyState
          icon="file-tray-outline"
          title="Keine Treffer"
          message={`Für „${query}“ wurde nichts gefunden.`}
        />
      )}

      {status === 'done' && results.length > 0 && (
        <ScrollView
          contentContainerStyle={[
            styles.results,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text variant="footnote" color="textTertiary" style={styles.count}>
            {results.length} {results.length === 1 ? 'Buch' : 'Bücher'}
          </Text>
          {results.map((result) => (
            <SearchResultCard
              key={result.book.id}
              result={result}
              onOpenBook={() => openBook(result.book.id)}
              onOpenPage={(pageIndex) => openPage(result.book.id, pageIndex)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchField: { paddingHorizontal: 16, paddingBottom: 8 },
  loading: { paddingTop: 60, alignItems: 'center' },
  results: { padding: 16, gap: 12 },
  count: { marginBottom: 4, marginLeft: 4 },
});
