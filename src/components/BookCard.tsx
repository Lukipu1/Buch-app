import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { Book } from '@/types/models';
import { formatPageCount, readingProgress } from '@/utils/format';
import { haptic } from '@/utils/haptics';

import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

interface BookCardProps {
  book: Book;
  onPress: () => void;
}

/** Card used in the library grid: cover, title, author and reading progress. */
export function BookCard({ book, onPress }: BookCardProps) {
  const theme = useTheme();
  const progress = readingProgress(book.currentPageIndex, book.totalPages);
  const showProgress = book.lastOpenedAt !== null && book.totalPages > 0;

  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View
        style={[
          styles.cover,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            ...theme.shadows.md,
          },
        ]}
      >
        {book.coverImageUri ? (
          <Image
            source={{ uri: book.coverImageUri }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons
              name="book-outline"
              size={34}
              color={theme.colors.textTertiary}
            />
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <Text variant="subhead" numberOfLines={2}>
          {book.title}
        </Text>
        {book.author ? (
          <Text
            variant="footnote"
            color="textSecondary"
            numberOfLines={1}
            style={styles.author}
          >
            {book.author}
          </Text>
        ) : null}
        <Text variant="caption" color="textTertiary" style={styles.pages}>
          {formatPageCount(book.totalPages)}
        </Text>
        {showProgress && (
          <View style={styles.progress}>
            <ProgressBar progress={progress} height={4} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cover: {
    aspectRatio: 3 / 4,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { marginTop: 10, paddingHorizontal: 2 },
  author: { marginTop: 2 },
  pages: { marginTop: 4 },
  progress: { marginTop: 8 },
});
