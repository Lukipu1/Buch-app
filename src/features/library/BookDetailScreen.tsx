import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionSheet,
  ActionSheetItem,
  AppButton,
  AppCard,
  EmptyState,
  IconButton,
  ProgressBar,
  Skeleton,
  Text,
  confirm,
} from '@/components';
import { bookRepository, pageRepository } from '@/services/database';
import { isOcrAvailable } from '@/services/ocr';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useOcrStore } from '@/store/useOcrStore';
import { useTheme } from '@/theme';
import { Page } from '@/types/models';
import {
  formatDuration,
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
  const enqueueOcr = useOcrStore((s) => s.enqueueBook);
  const ocrJob = useOcrStore((s) => s.jobs[bookId]);
  const ocrVersion = useOcrStore((s) => s.versions[bookId] ?? 0);

  const { book, pages, loading, notFound, reload } = useBookDetail(bookId);
  const [editing, setEditing] = useState(false);
  const [pageMenu, setPageMenu] = useState<Page | null>(null);

  // Re-fetch when returning from the scanner or reader.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  // Show recognised text as soon as the background run stores it.
  useEffect(() => {
    if (ocrVersion > 0) void reload();
  }, [ocrVersion, reload]);

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

  const afterPageChange = useCallback(async () => {
    await reload();
    await refreshLibrary();
  }, [refreshLibrary, reload]);

  const movePage = useCallback(
    async (page: Page, delta: -1 | 1) => {
      const ids = pages.map((p) => p.id);
      const from = ids.indexOf(page.id);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= ids.length) return;
      ids.splice(from, 1);
      ids.splice(to, 0, page.id);
      await pageRepository.reorderPages(bookId, ids);
      haptic.selection();
      await afterPageChange();
    },
    [afterPageChange, bookId, pages],
  );

  const deletePage = useCallback(
    async (page: Page) => {
      const ok = await confirm({
        title: `Seite ${page.pageIndex + 1} löschen?`,
        message: 'Die Seite und ihr erkannter Text werden entfernt.',
        confirmLabel: 'Löschen',
        destructive: true,
      });
      if (!ok) return;
      haptic.warning();
      await pageRepository.deletePage(bookId, page.id);
      await afterPageChange();
    },
    [afterPageChange, bookId],
  );

  const recognizePage = useCallback(
    async (page: Page) => {
      await pageRepository.updateOcrText(page.id, null);
      enqueueOcr(bookId);
      await reload();
    },
    [bookId, enqueueOcr, reload],
  );

  const recognizeAll = useCallback(async () => {
    const ok = await confirm({
      title: 'Text neu erkennen?',
      message: 'Der Text aller Seiten wird erneut erkannt. Das kann etwas dauern.',
      confirmLabel: 'Neu erkennen',
    });
    if (!ok) return;
    await pageRepository.resetOcr(bookId);
    enqueueOcr(bookId);
    await reload();
  }, [bookId, enqueueOcr, reload]);

  if (loading && !book) return <DetailSkeleton />;

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
  const pendingOcr = pages.filter((p) => p.ocrText === null).length;
  const withText = pages.filter((p) => p.ocrText).length;
  const ocrEnabled = isOcrAvailable();

  const pageActions = (page: Page): ActionSheetItem[] => [
    {
      label: 'Ab hier lesen',
      icon: 'book-outline',
      onPress: () => router.push(`/reader/${book.id}?page=${page.pageIndex}`),
    },
    {
      label: 'Als Cover verwenden',
      icon: 'image-outline',
      onPress: async () => {
        await bookRepository.update(book.id, { coverImageUri: page.imageUri });
        haptic.success();
        await afterPageChange();
      },
    },
    ...(ocrEnabled
      ? [
          {
            label: 'Text neu erkennen',
            icon: 'scan-outline' as const,
            onPress: () => void recognizePage(page),
          },
        ]
      : []),
    {
      label: 'Nach vorne verschieben',
      icon: 'arrow-back-outline',
      disabled: page.pageIndex === 0,
      onPress: () => void movePage(page, -1),
    },
    {
      label: 'Nach hinten verschieben',
      icon: 'arrow-forward-outline',
      disabled: page.pageIndex >= pages.length - 1,
      onPress: () => void movePage(page, 1),
    },
    {
      label: 'Seite löschen',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => void deletePage(page),
    },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 48 }]}>
          <View style={[styles.cover, { borderRadius: theme.radius.md, ...theme.shadows.lg }]}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="book-outline" size={44} color={theme.colors.textTertiary} />
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
            <Stat
              label="Lesezeit"
              value={
                book.readingTimeMs < 60_000 ? '–' : formatDuration(book.readingTimeMs / 60_000)
              }
            />
          </View>
          {book.totalPages > 0 && (
            <View style={styles.progressWrap}>
              <ProgressBar progress={progress} />
              <Text variant="caption" color="textTertiary" style={styles.lastOpened}>
                {book.lastOpenedAt
                  ? `Zuletzt gelesen · ${formatRelativeTime(book.lastOpenedAt)}`
                  : 'Noch nicht gelesen'}
              </Text>
            </View>
          )}
        </AppCard>

        {ocrEnabled && pages.length > 0 && (
          <OcrStatusCard
            running={Boolean(ocrJob)}
            done={ocrJob?.done ?? 0}
            total={ocrJob?.total ?? pendingOcr}
            pending={pendingOcr}
            withText={withText}
            pageCount={pages.length}
            onStart={() => enqueueOcr(bookId)}
            onRedo={recognizeAll}
          />
        )}

        <View style={styles.actions}>
          <AppButton
            label={book.lastOpenedAt ? 'Weiterlesen' : 'Lesen'}
            icon="book"
            size="lg"
            fullWidth
            disabled={book.totalPages === 0}
            onPress={() => router.push(`/reader/${book.id}`)}
          />
          <AppButton
            label="Seiten scannen"
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
        {pages.length > 0 && (
          <Text variant="caption" color="textTertiary" style={styles.pagesHint}>
            Tippen zum Lesen · Gedrückt halten für Cover, Reihenfolge, Text und Löschen
          </Text>
        )}

        {pages.length === 0 ? (
          <AppCard>
            <Text variant="subhead" color="textSecondary" center>
              Noch keine Seiten. Tippe auf „Seiten scannen“, um zu beginnen.
            </Text>
          </AppCard>
        ) : (
          <View style={styles.pageGrid}>
            {pages.map((page) => (
              <PageThumb
                key={page.id}
                page={page}
                isCover={page.imageUri === book.coverImageUri}
                isCurrent={page.pageIndex === book.currentPageIndex && book.lastOpenedAt !== null}
                onPress={() => router.push(`/reader/${book.id}?page=${page.pageIndex}`)}
                onLongPress={() => {
                  haptic.medium();
                  setPageMenu(page);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.floatingClose, { top: insets.top + 4 }]} pointerEvents="box-none">
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

      {pageMenu && (
        <ActionSheet
          title={`Seite ${pageMenu.pageIndex + 1}`}
          message={
            pageMenu.ocrText === null
              ? 'Text wird noch erkannt'
              : pageMenu.ocrText
                ? `${pageMenu.ocrText.split(/\s+/).length} Wörter erkannt`
                : 'Kein Text erkannt'
          }
          actions={pageActions(pageMenu)}
          onClose={() => setPageMenu(null)}
        />
      )}
    </View>
  );
}

function OcrStatusCard({
  running,
  done,
  total,
  pending,
  withText,
  pageCount,
  onStart,
  onRedo,
}: {
  running: boolean;
  done: number;
  total: number;
  pending: number;
  withText: number;
  pageCount: number;
  onStart: () => void;
  onRedo: () => void;
}) {
  const theme = useTheme();

  let icon: keyof typeof Ionicons.glyphMap = 'checkmark-circle';
  let title = 'Text erkannt';
  let message = `${withText} von ${pageCount} Seiten enthalten Text – bereit für den Textmodus.`;
  let action: React.ReactNode = (
    <AppButton label="Neu erkennen" variant="plain" onPress={onRedo} style={styles.ocrAction} />
  );

  if (running) {
    icon = 'sparkles';
    title = 'Text wird erkannt';
    message = total > 0 ? `Seite ${Math.min(done + 1, total)} von ${total} …` : 'Wird vorbereitet …';
    action = null;
  } else if (pending > 0) {
    icon = 'time-outline';
    title = 'Texterkennung ausstehend';
    message = `${formatPageCount(pending)} warten auf die Erkennung.`;
    action = <AppButton label="Starten" variant="plain" onPress={onStart} style={styles.ocrAction} />;
  }

  return (
    <AppCard style={styles.ocrCard}>
      <View style={styles.ocrRow}>
        <View
          style={[
            styles.ocrIcon,
            { backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.sm },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.colors.accent} />
        </View>
        <View style={styles.ocrText}>
          <Text variant="subhead" style={styles.ocrTitle}>
            {title}
          </Text>
          <Text variant="footnote" color="textSecondary">
            {message}
          </Text>
        </View>
        {action}
      </View>
      {running && total > 0 && (
        <View style={styles.ocrProgress}>
          <ProgressBar progress={done / total} height={4} />
        </View>
      )}
    </AppCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="headline" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="caption" color="textTertiary" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />;
}

function PageThumb({
  page,
  isCover,
  isCurrent,
  onPress,
  onLongPress,
}: {
  page: Page;
  isCover: boolean;
  isCurrent: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seite ${page.pageIndex + 1} lesen`}
      accessibilityHint="Gedrückt halten für weitere Optionen"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [styles.pageCell, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View
        style={[
          styles.pageThumb,
          {
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surface,
            borderColor: isCurrent ? theme.colors.accent : 'transparent',
            ...theme.shadows.sm,
          },
        ]}
      >
        <Image source={{ uri: page.imageUri }} style={styles.pageImage} />
        {page.ocrText === null && (
          <View style={styles.pageBadge}>
            <Ionicons name="time-outline" size={12} color="#FFFFFF" />
          </View>
        )}
        {isCover && (
          <View style={[styles.pageBadge, styles.coverBadge]}>
            <Ionicons name="star" size={11} color="#FFFFFF" />
          </View>
        )}
      </View>
      <Text
        variant="caption"
        color={isCurrent ? 'accent' : 'textTertiary'}
        center
        style={styles.pageNumber}
      >
        {page.pageIndex + 1}
      </Text>
    </Pressable>
  );
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
          paddingTop: insets.top + 48,
          paddingHorizontal: theme.spacing.lg,
          alignItems: 'center',
        },
      ]}
    >
      <Skeleton width={150} height={200} radius={theme.radius.md} />
      <Skeleton width={200} height={22} style={styles.skeletonLine} />
      <Skeleton width={120} height={16} style={styles.skeletonLine} />
      <Skeleton width="100%" height={90} style={styles.skeletonLine} radius={theme.radius.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center' },
  cover: { width: 150, aspectRatio: 3 / 4, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 20 },
  statsCard: { marginTop: 24 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statLabel: { marginTop: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 32 },
  progressWrap: { marginTop: 16 },
  lastOpened: { marginTop: 8, textAlign: 'center' },
  ocrCard: { marginTop: 12 },
  ocrRow: { flexDirection: 'row', alignItems: 'center' },
  ocrIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  ocrText: { flex: 1, marginLeft: 12 },
  ocrTitle: { fontWeight: '600' },
  ocrAction: { height: 36 },
  ocrProgress: { marginTop: 12 },
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
  pagesHint: { marginTop: -6, marginBottom: 12 },
  pageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pageCell: { width: '30%', flexGrow: 1, maxWidth: '31.5%' },
  pageThumb: { aspectRatio: 3 / 4, overflow: 'hidden', borderWidth: 2 },
  pageImage: { width: '100%', height: '100%' },
  pageBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  coverBadge: { right: undefined, left: 5, backgroundColor: 'rgba(255,170,0,0.9)' },
  pageNumber: { marginTop: 6 },
  floatingClose: { position: 'absolute', left: 12 },
  skeletonLine: { marginTop: 16 },
});
