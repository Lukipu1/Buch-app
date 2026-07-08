import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, IconButton, Text } from '@/components';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';

import { ReaderOverview } from './ReaderOverview';
import { ReaderPage } from './ReaderPage';
import { ReaderSettingsBar } from './ReaderSettingsBar';
import { ReaderAppearance, readerColors } from './readerTheme';
import { useReaderController } from './useReaderController';

interface ReaderScreenProps {
  bookId: string;
  initialPage?: number;
}

export function ReaderScreen({ bookId, initialPage }: ReaderScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);

  const defaultFontSize = useSettingsStore((s) => s.settings.readerFontSize);

  const { book, pages, loading, currentIndex, setCurrentIndex } =
    useReaderController(bookId, initialPage);

  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [appearance, setAppearance] = useState<ReaderAppearance>(
    theme.scheme === 'dark' ? 'dark' : 'light',
  );
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);

  const colors = readerColors(appearance, theme);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setCurrentIndex(first.index);
    },
  ).current;

  const goToPage = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }, [setCurrentIndex]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={theme.colors.accent} />
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
      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={currentIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <ReaderPage page={item} mode={mode} fontSize={fontSize} colors={colors} />
        )}
        onScrollBeginDrag={() => {
          setChromeVisible(false);
          setSettingsOpen(false);
        }}
      />

      {/* Tap zones to toggle chrome */}
      <View
        style={styles.tapZone}
        pointerEvents="box-none"
      >
        <View
          style={styles.tapArea}
          onTouchEnd={() => setChromeVisible((v) => !v)}
        />
      </View>

      {chromeVisible && (
        <>
          <View
            style={[
              styles.topBar,
              {
                paddingTop: insets.top + 8,
                backgroundColor: colors.background,
                borderBottomColor: theme.colors.separator,
              },
            ]}
          >
            <IconButton
              icon="chevron-back"
              accessibilityLabel="Zurück"
              onPress={() => router.back()}
              color={colors.text}
            />
            <Text
              variant="headline"
              numberOfLines={1}
              style={[styles.topTitle, { color: colors.text }]}
            >
              {book.title}
            </Text>
            <IconButton
              icon={mode === 'image' ? 'text' : 'image'}
              accessibilityLabel={
                mode === 'image' ? 'Textmodus' : 'Bildmodus'
              }
              onPress={() => setMode((m) => (m === 'image' ? 'text' : 'image'))}
              color={colors.text}
            />
          </View>

          <View
            style={[
              styles.bottomBar,
              {
                paddingBottom: insets.bottom + 12,
                backgroundColor: colors.background,
                borderTopColor: theme.colors.separator,
              },
            ]}
          >
            <IconButton
              icon="grid-outline"
              accessibilityLabel="Seitenübersicht"
              onPress={() => setOverviewOpen(true)}
              color={colors.text}
            />
            <Text variant="footnote" style={{ color: colors.muted }}>
              Seite {currentIndex + 1} von {pages.length}
            </Text>
            <IconButton
              icon="text-outline"
              accessibilityLabel="Leseeinstellungen"
              onPress={() => setSettingsOpen((v) => !v)}
              color={colors.text}
            />
          </View>
        </>
      )}

      {settingsOpen && chromeVisible && (
        <View style={[styles.settingsPopover, { bottom: insets.bottom + 76 }]}>
          <ReaderSettingsBar
            fontSize={fontSize}
            onFontSize={setFontSize}
            appearance={appearance}
            onAppearance={setAppearance}
          />
        </View>
      )}

      {overviewOpen && (
        <ReaderOverview
          pages={pages}
          currentIndex={currentIndex}
          onSelect={(index) => {
            setOverviewOpen(false);
            requestAnimationFrame(() => goToPage(index));
          }}
          onClose={() => setOverviewOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tapZone: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  tapArea: { width: '40%', height: '60%' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: { flex: 1, textAlign: 'center', marginHorizontal: 8 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  settingsPopover: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
});
