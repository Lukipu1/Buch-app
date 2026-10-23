import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Text } from '@/components';
import { useOcrStore } from '@/store/useOcrStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Bookmark, Page } from '@/types/models';
import { haptic } from '@/utils/haptics';

import {
  TextRange,
  buildBookStream,
  formatDuration,
  globalOffset,
  pageIndexForOffset,
  rangeIndexForOffset,
  readingMinutes,
  toParagraphs,
} from './bookText';
import { ReaderAppearanceSheet } from './ReaderAppearanceSheet';
import { ReaderChrome } from './ReaderChrome';
import { ReaderContentsSheet } from './ReaderContentsSheet';
import { ImagePageView, PageFrame, TextPageView } from './ReaderPage';
import { ReaderSearchSheet } from './ReaderSearchSheet';
import {
  READER_MARGINS,
  READER_SPACING,
  fontFamilyFor,
  readerColors,
  readerTextStyle,
} from './readerTheme';
import { TextPaginator } from './TextPaginator';
import { ReaderPosition, useReaderController } from './useReaderController';

interface ReaderScreenProps {
  bookId: string;
  /** `pageIndex` of the page to open at (e.g. from search or the page grid). */
  initialPage?: number;
}

type Sheet = 'appearance' | 'contents' | 'search' | null;
type FooterMode = 'page' | 'time';

const EMPTY_RANGES: TextRange[] = [];
const KEEP_AWAKE_TAG = 'buch-reader';

/**
 * Kindle-style reader.
 *
 * Text mode flows the recognised text of all pages into one continuous book
 * and paginates it to the screen with the chosen typography. Image mode shows
 * the original scans. Tap the left/right edge to turn pages, the centre to
 * show the menu; swipe works too. Position, bookmarks and reading time are
 * stored per book.
 */
export function ReaderScreen({ bookId, initialPage }: ReaderScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const colors = readerColors(settings.readerTheme);

  const {
    book,
    pages,
    bookmarks,
    loading,
    initialPosition,
    reportPosition,
    addBookmark,
    removeBookmarks,
  } = useReaderController(bookId, initialPage);
  const ocrJob = useOcrStore((s) => s.jobs[bookId]);

  const stream = useMemo(() => buildBookStream(pages), [pages]);
  const hasText = stream.text.trim().length > 0;
  const mode = hasText ? settings.readerMode : 'image';

  // ── Layout ──────────────────────────────────────────────────────────────
  // Freeze insets so showing/hiding the status bar never re-paginates.
  const [frameInsets] = useState(() => ({ top: insets.top, bottom: insets.bottom }));
  const frame: PageFrame = useMemo(
    () => ({
      width,
      height,
      paddingTop: frameInsets.top + 34,
      paddingBottom: frameInsets.bottom + 34,
      paddingHorizontal: READER_MARGINS[settings.readerMargin],
    }),
    [frameInsets, height, settings.readerMargin, width],
  );
  const fontSize = settings.readerFontSize;
  const lineHeight = Math.round(fontSize * READER_SPACING[settings.readerSpacing]);
  const textStyle = useMemo(
    () =>
      readerTextStyle({
        fontSize,
        lineHeight,
        fontFamily: fontFamilyFor(settings.readerFont),
        justify: settings.readerJustify,
        color: colors.text,
      }),
    [colors.text, fontSize, lineHeight, settings.readerFont, settings.readerJustify],
  );
  const columnWidth = frame.width - frame.paddingHorizontal * 2;
  const columnHeight = frame.height - frame.paddingTop - frame.paddingBottom;

  // ── Pagination ──────────────────────────────────────────────────────────
  const layoutKey = [
    stream.text.length,
    pages.length,
    fontSize,
    lineHeight,
    settings.readerFont,
    settings.readerJustify,
    columnWidth,
    columnHeight,
  ].join('|');
  const [pagination, setPagination] = useState({
    key: '',
    ranges: EMPTY_RANGES,
    done: false,
  });
  const ranges = pagination.key === layoutKey ? pagination.ranges : EMPTY_RANGES;
  const paginationDone = pagination.key === layoutKey && pagination.done;
  const onPaginate = useCallback(
    (next: TextRange[], done: boolean) => setPagination({ key: layoutKey, ranges: next, done }),
    [layoutKey],
  );

  // ── Position ────────────────────────────────────────────────────────────
  const [position, setPosition] = useState<ReaderPosition | null>(null);
  const positionRef = useRef<ReaderPosition | null>(null);
  useEffect(() => {
    if (loading || positionRef.current) return;
    positionRef.current = initialPosition;
    setPosition(initialPosition);
  }, [initialPosition, loading]);

  const updatePosition = useCallback(
    (next: ReaderPosition) => {
      positionRef.current = next;
      setPosition(next);
      reportPosition(next);
    },
    [reportPosition],
  );

  const positionFromGlobal = useCallback(
    (offset: number): ReaderPosition => {
      const pageIdx = pageIndexForOffset(stream, offset);
      return { pageIdx, local: Math.max(0, offset - (stream.pageStarts[pageIdx] ?? 0)) };
    },
    [stream],
  );

  const pageIdx = Math.min(position?.pageIdx ?? 0, Math.max(0, pages.length - 1));
  const currentGlobal = position ? globalOffset(stream, pageIdx, position.local) : 0;
  const textIndex = rangeIndexForOffset(ranges, currentGlobal);

  // Changing this remounts the list at the current position (jumps, re-layout).
  const [listNonce, setListNonce] = useState(0);
  const listKey = `${mode}|${mode === 'text' ? layoutKey : 'image'}|${listNonce}`;
  const anchor = useMemo(() => {
    const p = positionRef.current;
    return p ? globalOffset(stream, p.pageIdx, p.local) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey, stream]);
  const textReady =
    paginationDone || (ranges.length > 0 && ranges[ranges.length - 1].end > anchor);

  const jumpTo = useCallback(
    (next: ReaderPosition) => {
      updatePosition(next);
      setListNonce((n) => n + 1);
    },
    [updatePosition],
  );

  // ── Chrome & sheets ─────────────────────────────────────────────────────
  const [chromeVisible, setChromeVisible] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [footerMode, setFooterMode] = useState<FooterMode>('page');

  useEffect(() => {
    if (!settings.keepScreenAwake) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      void Promise.resolve(deactivateKeepAwake(KEEP_AWAKE_TAG)).catch(() => {});
    };
  }, [settings.keepScreenAwake]);

  // ── Page turning ────────────────────────────────────────────────────────
  const textListRef = useRef<FlatList<TextRange>>(null);
  const imageListRef = useRef<FlatList<Page>>(null);

  const turn = (delta: 1 | -1) => {
    const current = mode === 'text' ? textIndex : pageIdx;
    const count = mode === 'text' ? ranges.length : pages.length;
    const next = current + delta;
    if (next < 0 || next >= count) {
      haptic.warning();
      return;
    }
    if (mode === 'text') {
      textListRef.current?.scrollToIndex({ index: next, animated: true });
      updatePosition(positionFromGlobal(ranges[next].start));
    } else {
      imageListRef.current?.scrollToIndex({ index: next, animated: true });
      updatePosition({ pageIdx: next, local: 0 });
    }
  };

  const onTap = (x: number) => {
    if (chromeVisible) {
      setChromeVisible(false);
      return;
    }
    if (x < width * 0.3) turn(-1);
    else if (x > width * 0.7) turn(1);
    else setChromeVisible(true);
  };
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const stableTap = useCallback((x: number) => onTapRef.current(x), []);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (mode === 'text') {
      const range = ranges[index];
      if (range) updatePosition(positionFromGlobal(range.start));
    } else if (index >= 0 && index < pages.length) {
      updatePosition({ pageIdx: index, local: 0 });
    }
  };

  // ── Bookmarks ───────────────────────────────────────────────────────────
  const pageIdxById = useMemo(() => new Map(pages.map((p, i) => [p.id, i])), [pages]);
  const currentRange = ranges[textIndex];

  const currentBookmarks = useMemo(() => {
    if (!position) return [];
    if (mode === 'text') {
      if (!currentRange) return [];
      return bookmarks.filter((b) => {
        const idx = pageIdxById.get(b.pageId);
        if (idx === undefined) return false;
        const g = globalOffset(stream, idx, b.textOffset);
        return g >= currentRange.start && g < currentRange.end;
      });
    }
    const page = pages[pageIdx];
    return bookmarks.filter((b) => b.pageId === page?.id);
  }, [bookmarks, currentRange, mode, pageIdx, pageIdxById, pages, position, stream]);

  const toggleBookmark = () => {
    const page = pages[pageIdx];
    if (!page) return;
    if (currentBookmarks.length > 0) {
      void removeBookmarks(currentBookmarks.map((b) => b.id));
      return;
    }
    haptic.success();
    if (mode === 'text' && currentRange) {
      const snippet = stream.text
        .slice(currentRange.start, currentRange.start + 120)
        .replace(/\s+/g, ' ')
        .trim();
      void addBookmark(page.id, currentRange.start - stream.pageStarts[pageIdx], snippet);
    } else {
      const snippet = toParagraphs(page.ocrText ?? '')[0]?.slice(0, 120) ?? null;
      void addBookmark(page.id, 0, snippet);
    }
  };

  const openBookmark = (bookmark: Bookmark) => {
    const idx = pageIdxById.get(bookmark.pageId);
    setSheet(null);
    if (idx !== undefined) jumpTo({ pageIdx: idx, local: bookmark.textOffset });
  };

  // ── Labels ──────────────────────────────────────────────────────────────
  const textLength = Math.max(1, stream.text.length);
  const estimatedTotal = paginationDone
    ? ranges.length
    : ranges.length > 0
      ? Math.max(ranges.length, Math.round((ranges.length * textLength) / ranges[ranges.length - 1].end))
      : 0;

  const progress =
    mode === 'text'
      ? currentRange
        ? currentRange.end / textLength
        : currentGlobal / textLength
      : pages.length > 1
        ? pageIdx / (pages.length - 1)
        : 1;

  const pageLabel =
    mode === 'text'
      ? `Seite ${textIndex + 1} von ${paginationDone ? '' : '≈ '}${estimatedTotal || '…'}`
      : `Seite ${pageIdx + 1} von ${pages.length}`;

  const remainingMinutes = hasText
    ? readingMinutes(Math.max(0, stream.text.length - (currentRange?.end ?? currentGlobal)))
    : (pages.length - pageIdx - 1) * 1.5;
  const remainingLabel =
    remainingMinutes < 0.5 ? 'Letzte Seite' : `Noch ${formatDuration(remainingMinutes)}`;
  const percentLabel = `${Math.round(Math.min(1, progress) * 100)} %`;
  const footerLabel = footerMode === 'page' ? pageLabel : remainingLabel;

  const statusLabel = ocrJob
    ? ocrJob.total > 0
      ? `Text wird erkannt · ${ocrJob.done} von ${ocrJob.total}`
      : 'Text wird erkannt …'
    : null;

  const previewLabel = (value: number) => {
    if (mode === 'text') {
      const total = Math.max(1, estimatedTotal);
      return `Seite ${Math.min(total, Math.floor(value * total) + 1)}`;
    }
    return `Seite ${Math.round(value * Math.max(0, pages.length - 1)) + 1}`;
  };

  const onScrub = (value: number) => {
    if (mode === 'text') {
      jumpTo(positionFromGlobal(Math.floor(value * (textLength - 1))));
    } else {
      jumpTo({ pageIdx: Math.round(value * Math.max(0, pages.length - 1)), local: 0 });
    }
  };

  const toggleMode = () => {
    if (!hasText) return;
    void updateSettings({ readerMode: mode === 'text' ? 'image' : 'text' });
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading || (!position && pages.length > 0)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!book || pages.length === 0) {
    return (
      <EmptyState
        icon="book-outline"
        title="Nichts zu lesen"
        message="Dieses Buch enthält noch keine Seiten."
        actionLabel="Zurück"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <StatusBar
        hidden={!chromeVisible && sheet === null}
        style={colors.isDark ? 'light' : 'dark'}
        animated
      />

      {mode === 'text' && (
        <TextPaginator
          key={layoutKey}
          text={stream.text}
          style={textStyle}
          width={columnWidth}
          height={columnHeight}
          lineHeight={lineHeight}
          onUpdate={onPaginate}
        />
      )}

      {mode === 'text' ? (
        textReady ? (
          <FlatList
            key={listKey}
            ref={textListRef}
            data={ranges}
            keyExtractor={(r) => String(r.start)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={rangeIndexForOffset(ranges, anchor)}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            onMomentumScrollEnd={onMomentumEnd}
            onScrollBeginDrag={() => setChromeVisible(false)}
            renderItem={({ item }) => (
              <TextPageView
                text={stream.text.slice(item.start, item.end).replace(/\n+$/, '')}
                textStyle={textStyle}
                frame={frame}
                onTap={stableTap}
              />
            )}
          />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
            <Text variant="footnote" style={[styles.layoutHint, { color: colors.muted }]}>
              Seiten werden gesetzt …
            </Text>
          </View>
        )
      ) : (
        <FlatList
          key={listKey}
          ref={imageListRef}
          data={pages}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={pageIdx}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          onMomentumScrollEnd={onMomentumEnd}
          onScrollBeginDrag={() => setChromeVisible(false)}
          renderItem={({ item }) => (
            <ImagePageView imageUri={item.imageUri} frame={frame} onTap={stableTap} />
          )}
        />
      )}

      <ReaderChrome
        colors={colors}
        insetTop={frameInsets.top}
        insetBottom={frameInsets.bottom}
        visible={chromeVisible}
        title={book.title}
        author={book.author}
        bookmarked={currentBookmarks.length > 0}
        mode={mode}
        canUseText={hasText}
        progress={Math.min(1, progress)}
        pageLabel={pageLabel}
        remainingLabel={remainingLabel}
        percentLabel={percentLabel}
        statusLabel={statusLabel}
        footerLabel={footerLabel}
        previewLabel={previewLabel}
        onScrub={onScrub}
        onClose={() => router.back()}
        onToggleBookmark={toggleBookmark}
        onOpenContents={() => setSheet('contents')}
        onOpenSearch={() => setSheet('search')}
        onOpenAppearance={() => setSheet('appearance')}
        onToggleMode={toggleMode}
        onFooterPress={() => setFooterMode((m) => (m === 'page' ? 'time' : 'page'))}
      />

      {sheet === 'appearance' && (
        <ReaderAppearanceSheet hasText={hasText} onClose={() => setSheet(null)} />
      )}

      {sheet === 'contents' && (
        <ReaderContentsSheet
          pages={pages}
          currentPageIdx={pageIdx}
          bookmarks={bookmarks}
          onSelectPage={(idx) => {
            setSheet(null);
            jumpTo({ pageIdx: idx, local: 0 });
          }}
          onSelectBookmark={openBookmark}
          onDeleteBookmark={(b) => void removeBookmarks([b.id])}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'search' && (
        <ReaderSearchSheet
          stream={stream}
          onSelect={(match) => {
            setSheet(null);
            setChromeVisible(false);
            jumpTo(positionFromGlobal(match.offset));
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  layoutHint: { marginTop: 12 },
});
