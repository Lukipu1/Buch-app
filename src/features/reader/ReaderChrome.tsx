import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { ReaderMode } from '@/types/models';
import { haptic } from '@/utils/haptics';

import { ProgressScrubber } from './ProgressScrubber';
import { ReaderColors } from './readerTheme';

interface ReaderChromeProps {
  colors: ReaderColors;
  insetTop: number;
  insetBottom: number;
  visible: boolean;
  title: string;
  author: string | null;
  bookmarked: boolean;
  mode: ReaderMode;
  canUseText: boolean;
  progress: number;
  pageLabel: string;
  remainingLabel: string;
  percentLabel: string;
  statusLabel: string | null;
  footerLabel: string;
  previewLabel: (value: number) => string;
  onScrub: (value: number) => void;
  onClose: () => void;
  onToggleBookmark: () => void;
  onOpenContents: () => void;
  onOpenSearch: () => void;
  onOpenAppearance: () => void;
  onToggleMode: () => void;
  onFooterPress: () => void;
}

/**
 * Reading chrome. Hidden: only a faint title, the bookmark ribbon and a
 * one-line footer remain — like a Kindle. Visible: top bar with actions and a
 * bottom panel with the progress scrubber and reading tools.
 */
export function ReaderChrome(props: ReaderChromeProps) {
  const { colors, insetTop, insetBottom, visible } = props;

  return (
    <>
      {/* Always-on page furniture */}
      {!visible && (
        <>
          <View pointerEvents="none" style={[styles.runningTitle, { top: insetTop + 8 }]}>
            <Text variant="caption" numberOfLines={1} style={{ color: colors.muted }}>
              {props.title}
            </Text>
          </View>
          <Pressable
            onPress={props.onFooterPress}
            hitSlop={8}
            style={[styles.footer, { bottom: insetBottom + 6 }]}
            accessibilityRole="button"
            accessibilityLabel={props.footerLabel}
          >
            <Text variant="caption" style={{ color: colors.muted }}>
              {props.footerLabel}
            </Text>
            <Text variant="caption" style={{ color: colors.muted }}>
              {props.percentLabel}
            </Text>
          </Pressable>
        </>
      )}

      {props.bookmarked && (
        <View pointerEvents="none" style={[styles.ribbon, { top: visible ? insetTop + 52 : insetTop }]}>
          <Ionicons name="bookmark" size={28} color="#E5372C" />
        </View>
      )}

      {visible && (
        <>
          <View
            style={[
              styles.topBar,
              {
                paddingTop: insetTop + 4,
                backgroundColor: colors.chrome,
                borderBottomColor: colors.separator,
              },
            ]}
          >
            <ChromeButton icon="close" label="Reader schließen" color={colors.text} onPress={props.onClose} />
            <View style={styles.titleBlock}>
              <Text variant="headline" numberOfLines={1} style={{ color: colors.text }}>
                {props.title}
              </Text>
              {props.author ? (
                <Text variant="caption" numberOfLines={1} style={{ color: colors.muted }}>
                  {props.author}
                </Text>
              ) : null}
            </View>
            <ChromeButton
              icon={props.bookmarked ? 'bookmark' : 'bookmark-outline'}
              label={props.bookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}
              color={props.bookmarked ? '#E5372C' : colors.text}
              onPress={props.onToggleBookmark}
            />
          </View>

          <View
            style={[
              styles.bottomPanel,
              {
                paddingBottom: insetBottom + 8,
                backgroundColor: colors.chrome,
                borderTopColor: colors.separator,
              },
            ]}
          >
            {props.statusLabel && (
              <View style={styles.status}>
                <Ionicons name="sparkles-outline" size={13} color={colors.accent} />
                <Text variant="caption" style={[styles.statusText, { color: colors.accent }]}>
                  {props.statusLabel}
                </Text>
              </View>
            )}
            <ProgressScrubber
              value={props.progress}
              color={colors.accent}
              trackColor={colors.separator}
              previewLabel={props.previewLabel}
              onComplete={props.onScrub}
            />
            <View style={styles.labels}>
              <Text variant="caption" style={{ color: colors.text }}>
                {props.pageLabel}
              </Text>
              <Text variant="caption" style={{ color: colors.muted }}>
                {props.remainingLabel}
              </Text>
            </View>
            <View style={styles.tools}>
              <ChromeButton icon="list" label="Inhalt" color={colors.text} onPress={props.onOpenContents} caption="Inhalt" />
              <ChromeButton icon="search" label="Suchen" color={colors.text} onPress={props.onOpenSearch} caption="Suchen" />
              <ChromeButton icon="text" label="Darstellung" color={colors.text} onPress={props.onOpenAppearance} caption="Aa" />
              <ChromeButton
                icon={props.mode === 'text' ? 'image-outline' : 'document-text-outline'}
                label={props.mode === 'text' ? 'Original-Scan anzeigen' : 'Text anzeigen'}
                color={props.canUseText || props.mode === 'text' ? colors.text : colors.muted}
                onPress={props.onToggleMode}
                caption={props.mode === 'text' ? 'Original' : 'Text'}
              />
            </View>
          </View>
        </>
      )}
    </>
  );
}

function ChromeButton({
  icon,
  label,
  color,
  onPress,
  caption,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  caption?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [caption ? styles.tool : styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Ionicons name={icon} size={caption ? 22 : 24} color={color} />
      {caption ? (
        <Text variant="caption" style={[styles.toolCaption, { color }]}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  runningTitle: { position: 'absolute', left: 60, right: 60, alignItems: 'center' },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ribbon: { position: 'absolute', right: 20 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleBlock: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  status: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statusText: { marginLeft: 4, fontWeight: '600' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  tools: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  tool: { alignItems: 'center', minWidth: 64, paddingVertical: 2 },
  toolCaption: { marginTop: 3 },
});
