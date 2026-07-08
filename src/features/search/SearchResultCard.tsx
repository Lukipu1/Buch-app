import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Text } from '@/components';
import { useTheme } from '@/theme';
import { SearchResult } from '@/types/models';
import { formatPageCount } from '@/utils/format';

interface SearchResultCardProps {
  result: SearchResult;
  onOpenBook: () => void;
  onOpenPage: (pageIndex: number) => void;
}

/** One book's search result: metadata header plus any matching page snippets. */
export function SearchResultCard({
  result,
  onOpenBook,
  onOpenPage,
}: SearchResultCardProps) {
  const theme = useTheme();
  const { book, pageMatches } = result;

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.header} onTouchEnd={onOpenBook}>
        <View
          style={[
            styles.icon,
            { backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.sm },
          ]}
        >
          <Ionicons name="book" size={18} color={theme.colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text variant="headline" numberOfLines={1}>
            {book.title}
          </Text>
          <Text variant="footnote" color="textSecondary" numberOfLines={1}>
            {book.author ? `${book.author} · ` : ''}
            {formatPageCount(book.totalPages)}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textTertiary}
        />
      </View>

      {pageMatches.map((match) => (
        <View key={match.pageId}>
          <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
          <View
            style={styles.match}
            onTouchEnd={() => onOpenPage(match.pageIndex)}
          >
            <Text variant="footnote" color="accent" style={styles.matchPage}>
              Seite {match.pageIndex + 1}
            </Text>
            <Text variant="subhead" color="textSecondary" numberOfLines={2}>
              {match.snippet}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 14 },
  match: { paddingHorizontal: 14, paddingVertical: 12 },
  matchPage: { marginBottom: 4 },
});
