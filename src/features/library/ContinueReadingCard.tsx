import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, ProgressBar, Text } from '@/components';
import { useTheme } from '@/theme';
import { Book } from '@/types/models';
import { formatProgress, readingProgress } from '@/utils/format';
import { formatRelativeTime } from '@/utils/date';
import { haptic } from '@/utils/haptics';

interface ContinueReadingCardProps {
  book: Book;
  onRead: () => void;
  onOpenDetails: () => void;
}

/** Prominent "Weiterlesen" card for the most recently read book. */
export function ContinueReadingCard({ book, onRead, onOpenDetails }: ContinueReadingCardProps) {
  const theme = useTheme();
  const progress = readingProgress(book.currentPageIndex, book.totalPages);

  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onOpenDetails();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
          opacity: pressed ? 0.95 : 1,
          ...theme.shadows.md,
        },
      ]}
    >
      <View style={[styles.cover, { borderRadius: theme.radius.sm, ...theme.shadows.sm }]}>
        {book.coverImageUri ? (
          <Image source={{ uri: book.coverImageUri }} style={styles.coverImage} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
            <Ionicons name="book-outline" size={26} color={theme.colors.textTertiary} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text variant="caption" color="accent" style={styles.eyebrow}>
          WEITERLESEN
        </Text>
        <Text variant="headline" numberOfLines={2}>
          {book.title}
        </Text>
        {book.author ? (
          <Text variant="footnote" color="textSecondary" numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <ProgressBar progress={progress} height={4} />
          </View>
          <Text variant="caption" color="textSecondary" style={styles.percent}>
            {formatProgress(book.currentPageIndex, book.totalPages)}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text variant="caption" color="textTertiary">
            {formatRelativeTime(book.lastOpenedAt)}
          </Text>
          <AppButton label="Lesen" icon="book" onPress={onRead} style={styles.button} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 14 },
  cover: { width: 86, aspectRatio: 3 / 4, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginLeft: 14 },
  eyebrow: { fontWeight: '700', letterSpacing: 0.6, marginBottom: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  progressBar: { flex: 1 },
  percent: { marginLeft: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: { height: 34, paddingHorizontal: 14 },
});
