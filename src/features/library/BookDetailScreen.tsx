import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  AppButton,
  AppCard,
  EmptyState,
  IconButton,
  ProgressBar,
  Skeleton,
  Text,
  confirm,
} from '@/components';
import { bookRepository } from '@/services/database';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useTheme } from '@/theme';
import {
  formatPageCount,
  formatProgress,
  formatRelativeTime,
  readingProgress,
} from '@/utils/format';
import { haptic } from '@/utils/haptics';

import { EditBookSheet } from './EditBookSheet';
import { useBookDetail } from './useBookDetail';

export function BookDetailScreen({ bookId }: { bookId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const refreshLibrary = useLibraryStore((s) => s.refresh);

  const { book, pages, loading, notFound, reload } = useBookDetail(bookId);
  const [editing, setEditing] = useState(false);

  // Re-fetch when returning from the scanner or reader.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const onDelete = useCallback(async () => {
    if (!book) return;
    const ok = await confirm({
      title: 'Buch löschen?',
      message: `„${book.title}“ und alle gescannten Seiten werden dauerhaft entfernt.`,
      confirmLabel: 'Löschen',
      destructive: true,
    });
    if (!ok) return;
    haptic.warning();
    await bookRepository.delete(book.id);
    await refreshLibrary();
    router.back();
  }, [book, refreshLibrary, router]);

  if (loading) return <DetailSkeleton />;

  if (notFound || !book) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Buch nicht gefunden"
        message="Dieses Buch existiert nicht mehr."
        actionLabel="Zurück"
        onAction={() => router.back()}
      />
    );
  }

  const cover = book.coverImageUri ?? pages[0]?.imageUri ?? null;
  const progress = readingProgress(book.currentPageIndex, book.totalPages);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.cover,
              { borderRadius: theme.radius.lg, ...theme.shadows.lg },
            ]}
          >
            {cover ? (
              <Image source={{ uri: cover }} style={styles.coverImage} />
            ) : (
              <View
                style={[
                  styles.coverPlaceholder,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={44}
                  color={theme.colors.textTertiary}
                />
              </View>
            )}
          </View>

          <Text variant="title2" center style={styles.title}>
            {book.title}
          </Text>
          {book.author ? (
            <Text variant="callout" color="textSecondary" center>
              {book.author}
            </Text>
          ) : null}
        </View>

        <AppCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Stat label="Seiten" value={String(book.totalPages)} />
            <Divider />
            <Stat
              label="Fortschritt"
              value={formatProgress(book.currentPageIndex, book.totalPages)}
            />
            <Divider />
            <Stat label="Geöffnet" value={shortRelative(book.lastOpenedAt)} />
          </View>
          {book.totalPages > 0 && (
            <View style={styles.progressWrap}>
              <ProgressBar progress={progress} />
            </View>
          )}
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            label="Lesen"
            icon="book"
            size="lg"
            fullWidth
            disabled={book.totalPages === 0}
            onPress={() => router.push(`/reader/${book.id}`)}
          />
          <AppButton
            label="Weiter scannen"
            icon="scan"
            variant="tinted"
            size="lg"
            fullWidth
            onPress={() => router.push(`/scanner?bookId=${book.id}`)}
          />
          <View style={styles.secondaryRow}>
            <AppButton
              label="Bearbeiten"
              icon="create-outline"
              variant="secondary"
              onPress={() => setEditing(true)}
              style={styles.secondaryButton}
            />
            <AppButton
              label="Löschen"
              icon="trash-outline"
              variant="destructive"
              onPress={onDelete}
              style={styles.secondaryButton}
            />
          </View>
        </View>

        <View style={styles.pagesHeader}>
          <Text variant="headline">Seiten</Text>
          <Text variant="footnote" color="textTertiary">
            {formatPageCount(book.totalPages)}
          </Text>
        </View>

        {pages.length === 0 ? (
          <AppCard>
            <Text variant="subhead" color="textSecondary" center>
              Noch keine Seiten. Tippe auf „Weiter scannen“, um zu beginnen.
            </Text>
          </AppCard>
        ) : (
          <View style={styles.pageGrid}>
            {pages.map((page) => (
              <IconButtonPage
                key={page.id}
                imageUri={page.imageUri}
                index={page.pageIndex}
                onPress={() => router.push(`/reader/${book.id}?page=${page.pageIndex}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View
        style={[styles.floatingClose, { top: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Zurück"
          onPress={() => router.back()}
          tinted
        />
      </View>

      {editing && (
        <EditBookSheet
          book={book}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await reload();
            await refreshLibrary();
          }}
        />
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="headline">{value}</Text>
      <Text variant="caption" color="textTertiary" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return (
    <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
  );
}

function IconButtonPage({
  imageUri,
  index,
  onPress,
}: {
  imageUri: string;
  index: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.pageCell}>
      <View
        style={[
          styles.pageThumb,
          { borderRadius: theme.radius.md, ...theme.shadows.sm },
        ]}
      >
        <Image source={{ uri: imageUri }} style={styles.pageImage} />
      </View>
      <Text
        variant="caption"
        color="textTertiary"
        center
        onPress={onPress}
        style={styles.pageNumber}
      >
        Seite {index + 1}
      </Text>
    </View>
  );
}

function shortRelative(timestamp: number | null): string {
  if (!timestamp) return '—';
  return formatRelativeTime(timestamp).replace('vor ', '');
}

function DetailSkeleton() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.flex,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + 24,
          paddingHorizontal: theme.spacing.lg,
          alignItems: 'center',
        },
      ]}
    >
      <Skeleton width={160} height={220} radius={theme.radius.lg} />
      <Skeleton width={200} height={22} style={styles.skeletonLine} />
      <Skeleton width={120} height={16} style={styles.skeletonLine} />
      <Skeleton width="100%" height={90} style={styles.skeletonLine} radius={theme.radius.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: 72 },
  cover: {
    width: 160,
    aspectRatio: 3 / 4,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 20 },
  statsCard: { marginTop: 24 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { marginTop: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 32 },
  progressWrap: { marginTop: 16 },
  actions: { marginTop: 20, gap: 12 },
  secondaryRow: { flexDirection: 'row', gap: 12 },
  secondaryButton: { flex: 1 },
  pagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 12,
  },
  pageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pageCell: { width: '30%', flexGrow: 1, maxWidth: '31%' },
  pageThumb: { aspectRatio: 3 / 4, overflow: 'hidden' },
  pageImage: { width: '100%', height: '100%' },
  pageNumber: { marginTop: 6 },
  floatingClose: { position: 'absolute', left: 12 },
  skeletonLine: { marginTop: 16 },
});
