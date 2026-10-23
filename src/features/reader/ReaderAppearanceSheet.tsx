import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet, SegmentedControl, Text } from '@/components';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';
import { ReaderMargin, ReaderMode, ReaderSpacing } from '@/types/models';
import { haptic } from '@/utils/haptics';

import {
  READER_FONT_MAX,
  READER_FONT_MIN,
  READER_FONTS,
  READER_THEME_ORDER,
  READER_THEMES,
  fontFamilyFor,
} from './readerTheme';

const SERIF = fontFamilyFor('georgia');

interface ReaderAppearanceSheetProps {
  hasText: boolean;
  onClose: () => void;
}

const MODE_SEGMENTS: { value: ReaderMode; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Original-Scan' },
];

const SPACING: { value: ReaderSpacing; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { value: 'compact', icon: 'reorder-four-outline', label: 'Eng' },
  { value: 'normal', icon: 'reorder-three-outline', label: 'Normal' },
  { value: 'relaxed', icon: 'reorder-two-outline', label: 'Weit' },
];

const MARGINS: { value: ReaderMargin; label: string }[] = [
  { value: 'narrow', label: 'Schmal' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Breit' },
];

/** "Aa" panel: reading mode, typography, layout and colour theme. */
export function ReaderAppearanceSheet({ hasText, onClose }: ReaderAppearanceSheetProps) {
  const theme = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

  const set = (patch: Parameters<typeof update>[0]) => {
    haptic.selection();
    void update(patch);
  };

  const textControlsDisabled = !hasText || settings.readerMode === 'image';

  return (
    <BottomSheet onClose={onClose}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <SegmentedControl
          segments={MODE_SEGMENTS}
          value={hasText ? settings.readerMode : 'image'}
          onChange={(value) => {
            if (value === 'text' && !hasText) return;
            void update({ readerMode: value });
          }}
        />
        {!hasText && (
          <Text variant="footnote" color="textSecondary" style={styles.note}>
            Für dieses Buch liegt noch kein erkannter Text vor.
          </Text>
        )}

        <View
          style={[styles.section, textControlsDisabled && styles.disabled]}
          pointerEvents={textControlsDisabled ? 'none' : 'auto'}
        >
          {/* Font size */}
          <View
            style={[
              styles.sizeRow,
              { backgroundColor: theme.colors.background, borderRadius: theme.radius.md },
            ]}
          >
            <Pressable
              accessibilityLabel="Schrift kleiner"
              style={styles.sizeButton}
              onPress={() =>
                set({ readerFontSize: Math.max(READER_FONT_MIN, settings.readerFontSize - 1) })
              }
            >
              <Text style={styles.sizeSmall}>A</Text>
            </Pressable>
            <View style={[styles.sizeDivider, { backgroundColor: theme.colors.separator }]} />
            <Text variant="headline" style={styles.sizeValue}>
              {settings.readerFontSize}
            </Text>
            <View style={[styles.sizeDivider, { backgroundColor: theme.colors.separator }]} />
            <Pressable
              accessibilityLabel="Schrift größer"
              style={styles.sizeButton}
              onPress={() =>
                set({ readerFontSize: Math.min(READER_FONT_MAX, settings.readerFontSize + 1) })
              }
            >
              <Text style={styles.sizeLarge}>A</Text>
            </Pressable>
          </View>

          {/* Fonts */}
          <Text variant="footnote" color="textSecondary" style={styles.label}>
            Schriftart
          </Text>
          <View style={styles.fontRow}>
            {READER_FONTS.map((font) => {
              const active = font.key === settings.readerFont;
              return (
                <Pressable
                  key={font.key}
                  onPress={() => set({ readerFont: font.key })}
                  style={[
                    styles.fontChip,
                    {
                      borderRadius: theme.radius.md,
                      borderColor: active ? theme.colors.accent : theme.colors.separator,
                      backgroundColor: active ? theme.colors.accentMuted : theme.colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: font.family,
                      fontSize: 20,
                      color: active ? theme.colors.accent : theme.colors.text,
                    }}
                  >
                    Aa
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: active ? theme.colors.accent : theme.colors.textSecondary }}
                  >
                    {font.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Layout */}
          <View style={styles.layoutRow}>
            <View style={styles.layoutGroup}>
              <Text variant="footnote" color="textSecondary" style={styles.label}>
                Zeilenabstand
              </Text>
              <View style={styles.optionRow}>
                {SPACING.map((item) => (
                  <OptionButton
                    key={item.value}
                    active={settings.readerSpacing === item.value}
                    accessibilityLabel={item.label}
                    onPress={() => set({ readerSpacing: item.value })}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={
                        settings.readerSpacing === item.value
                          ? theme.colors.accent
                          : theme.colors.text
                      }
                    />
                  </OptionButton>
                ))}
              </View>
            </View>
            <View style={styles.layoutGroup}>
              <Text variant="footnote" color="textSecondary" style={styles.label}>
                Ausrichtung
              </Text>
              <View style={styles.optionRow}>
                <OptionButton
                  active={!settings.readerJustify}
                  accessibilityLabel="Linksbündig"
                  onPress={() => set({ readerJustify: false })}
                >
                  <Ionicons
                    name="menu-outline"
                    size={20}
                    color={!settings.readerJustify ? theme.colors.accent : theme.colors.text}
                  />
                </OptionButton>
                <OptionButton
                  active={settings.readerJustify}
                  accessibilityLabel="Blocksatz"
                  onPress={() => set({ readerJustify: true })}
                >
                  <Ionicons
                    name="reorder-four"
                    size={20}
                    color={settings.readerJustify ? theme.colors.accent : theme.colors.text}
                  />
                </OptionButton>
              </View>
            </View>
          </View>

          <Text variant="footnote" color="textSecondary" style={styles.label}>
            Seitenränder
          </Text>
          <SegmentedControl
            segments={MARGINS}
            value={settings.readerMargin}
            onChange={(value) => void update({ readerMargin: value })}
          />
        </View>

        {/* Themes */}
        <Text variant="footnote" color="textSecondary" style={[styles.label, styles.themeLabel]}>
          Hintergrund
        </Text>
        <View style={styles.themeRow}>
          {READER_THEME_ORDER.map((key) => {
            const item = READER_THEMES[key];
            const active = settings.readerTheme === key;
            return (
              <Pressable
                key={key}
                accessibilityLabel={item.label}
                onPress={() => set({ readerTheme: key })}
                style={styles.theme}
              >
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: item.background,
                      borderColor: active ? theme.colors.accent : theme.colors.separator,
                      borderWidth: active ? 2.5 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: item.text, fontFamily: SERIF, fontSize: 17 }}>Aa</Text>
                </View>
                <Text
                  variant="caption"
                  style={[
                    styles.themeText,
                    { color: active ? theme.colors.accent : theme.colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function OptionButton({
  active,
  onPress,
  accessibilityLabel,
  children,
}: {
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.option,
        {
          borderRadius: theme.radius.sm,
          backgroundColor: active ? theme.colors.accentMuted : theme.colors.background,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 8 },
  section: { marginTop: 20 },
  disabled: { opacity: 0.4 },
  sizeRow: { flexDirection: 'row', alignItems: 'center', height: 50 },
  sizeButton: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
  sizeSmall: { fontSize: 15, fontFamily: SERIF },
  sizeLarge: { fontSize: 24, fontFamily: SERIF },
  sizeDivider: { width: StyleSheet.hairlineWidth, height: 26 },
  sizeValue: { width: 56, textAlign: 'center' },
  label: { marginTop: 18, marginBottom: 8 },
  fontRow: { flexDirection: 'row', gap: 8 },
  fontChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    gap: 2,
  },
  layoutRow: { flexDirection: 'row', gap: 16 },
  layoutGroup: { flex: 1 },
  optionRow: { flexDirection: 'row', gap: 6 },
  option: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { marginTop: 22 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  theme: { alignItems: 'center' },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeText: { marginTop: 6 },
});
