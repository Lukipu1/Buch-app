import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import {
  AppCard,
  IconButton,
  SortButton,
  SortSheet,
  Text,
} from '@/components';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';
import { Page } from '@/types/models';
import { PAGE_SORT_OPTIONS, pageSortLabel } from '@/types/sort';
import { haptic } from '@/utils/haptics';
import { reorderPages } from '@/utils/reorderPages';
import { sortPages } from '@/utils/sortPages';

interface PageManagerProps {
  pages: Page[];
  onOpenPage: (pageIndex: number) => void;
  /** Persists a new page order; resolves once the change is saved. */
  onReordered: (orderedPageIds: string[]) => Promise<void>;
}

/**
 * Displays a book's pages with two modes:
 *  - **View**: pages shown in the selected sort order; tap to open in reader.
 *  - **Reorder**: pages fixed to index order with move controls. On each move
 *    the working copy is reindexed and persisted (recomputing `pageIndex`).
 */
export function PageManager({ pages, onOpenPage, onReordered }: PageManagerProps) {
  const pageSort = useAppStore((s) => s.pageSort);
  const setPageSort = useAppStore((s) => s.setPageSort);

  const [sortOpen, setSortOpen] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [working, setWorking] = useState<Page[]>(pages);

  // Keep the working copy in sync when the source pages change (e.g. reload).
  useEffect(() => {
    setWorking(sortPages(pages, 'indexAsc'));
  }, [pages]);

  const viewPages = useMemo(
    () => (reordering ? working : sortPages(pages, pageSort)),
    [reordering, working, pages, pageSort],
  );

  const move = async (from: number, to: number) => {
    if (to < 0 || to >= working.length) return;
    haptic.selection();
    const next = reorderPages(working, from, to);
    setWorking(next);
    await onReordered(next.map((p) => p.id));
  };

  return (
    <View>
      <View style={styles.header}>
        <Text variant="headline">Seiten</Text>
        <View style={styles.headerActions}>
          {pages.length > 1 && (
            <IconButton
              icon={reordering ? 'checkmark' : 'swap-vertical'}
              accessibilityLabel={
                reordering ? 'Sortierung abschließen' : 'Seiten umsortieren'
              }
              onPress={() => setReordering((v) => !v)}
              tinted={reordering}
            />
          )}
          {!reordering && pages.length > 1 && (
            <SortButton
              label={pageSortLabel(pageSort)}
              onPress={() => setSortOpen(true)}
              compact
            />
          )}
        </View>
      </View>

      {pages.length === 0 ? (
        <AppCard>
          <Text variant="subhead" color="textSecondary" center>
            Noch keine Seiten. Tippe auf „Weiter scannen“, um zu beginnen.
          </Text>
        </AppCard>
      ) : (
        <View style={styles.grid}>
          {viewPages.map((page, position) => (
            <PageThumb
              key={page.id}
              page={page}
              position={position}
              reordering={reordering}
              isFirst={position === 0}
              isLast={position === viewPages.length - 1}
              onPress={() => onOpenPage(page.pageIndex)}
              onMoveBack={() => move(position, position - 1)}
              onMoveForward={() => move(position, position + 1)}
            />
          ))}
        </View>
      )}

      {sortOpen && (
        <SortSheet
          title="Seiten sortieren"
          options={PAGE_SORT_OPTIONS}
          value={pageSort}
          onSelect={setPageSort}
          onClose={() => setSortOpen(false)}
        />
      )}
    </View>
  );
}

interface PageThumbProps {
  page: Page;
  position: number;
  reordering: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onMoveBack: () => void;
  onMoveForward: () => void;
}

function PageThumb({
  page,
  position,
  reordering,
  isFirst,
  isLast,
  onPress,
  onMoveBack,
  onMoveForward,
}: PageThumbProps) {
  const theme = useTheme();
  return (
    <View style={styles.cell}>
      <View
        style={[
          styles.thumb,
          { borderRadius: theme.radius.md, ...theme.shadows.sm },
        ]}
      >
        <Image source={{ uri: page.imageUri }} style={styles.image} />
        {reordering && (
          <View style={styles.moveOverlay}>
            <IconButton
              icon="chevron-back"
              accessibilityLabel="Nach vorne"
              onPress={onMoveBack}
              size={18}
              color={isFirst ? theme.colors.textTertiary : theme.colors.onAccent}
              style={styles.moveButton}
            />
            <IconButton
              icon="chevron-forward"
              accessibilityLabel="Nach hinten"
              onPress={onMoveForward}
              size={18}
              color={isLast ? theme.colors.textTertiary : theme.colors.onAccent}
              style={styles.moveButton}
            />
          </View>
        )}
      </View>
      <Text
        variant="caption"
        color="textTertiary"
        center
        onPress={reordering ? undefined : onPress}
        style={styles.number}
      >
        {reordering ? `Position ${position + 1}` : `Seite ${page.pageIndex + 1}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 12,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '30%', flexGrow: 1, maxWidth: '31%' },
  thumb: { aspectRatio: 3 / 4, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  moveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  moveButton: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    minWidth: 30,
    minHeight: 30,
  },
  number: { marginTop: 6 },
});
