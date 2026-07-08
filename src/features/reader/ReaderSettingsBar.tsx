import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton, Text } from '@/components';
import { useTheme } from '@/theme';

import { READER_FONT_MAX, READER_FONT_MIN, ReaderAppearance } from './readerTheme';

interface ReaderSettingsBarProps {
  fontSize: number;
  onFontSize: (size: number) => void;
  appearance: ReaderAppearance;
  onAppearance: (appearance: ReaderAppearance) => void;
}

const APPEARANCES: { key: ReaderAppearance; label: string; swatch: string }[] = [
  { key: 'light', label: 'Hell', swatch: '#FFFFFF' },
  { key: 'sepia', label: 'Sepia', swatch: '#FBF0D9' },
  { key: 'dark', label: 'Dunkel', swatch: '#1C1C1E' },
];

/** Popover controls for font size and reading appearance. */
export function ReaderSettingsBar({
  fontSize,
  onFontSize,
  appearance,
  onAppearance,
}: ReaderSettingsBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.backgroundElevated,
          borderRadius: theme.radius.lg,
          ...theme.shadows.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <Text variant="subhead" color="textSecondary">
          Schriftgröße
        </Text>
        <View style={styles.stepper}>
          <IconButton
            icon="remove"
            accessibilityLabel="Kleiner"
            onPress={() => onFontSize(Math.max(READER_FONT_MIN, fontSize - 1))}
          />
          <Text variant="headline" style={styles.fontValue}>
            {fontSize}
          </Text>
          <IconButton
            icon="add"
            accessibilityLabel="Größer"
            onPress={() => onFontSize(Math.min(READER_FONT_MAX, fontSize + 1))}
          />
        </View>
      </View>

      <View style={[styles.separator, { backgroundColor: theme.colors.separator }]} />

      <View style={styles.appearances}>
        {APPEARANCES.map((item) => {
          const active = item.key === appearance;
          return (
            <Pressable
              key={item.key}
              onPress={() => onAppearance(item.key)}
              style={styles.appearance}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: item.swatch,
                    borderColor: active ? theme.colors.accent : theme.colors.separator,
                    borderWidth: active ? 3 : StyleSheet.hairlineWidth,
                  },
                ]}
              />
              <Text
                variant="caption"
                color={active ? 'accent' : 'textSecondary'}
                style={styles.appearanceLabel}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  fontValue: { minWidth: 32, textAlign: 'center' },
  separator: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  appearances: { flexDirection: 'row', justifyContent: 'space-around' },
  appearance: { alignItems: 'center' },
  swatch: { width: 44, height: 44, borderRadius: 22 },
  appearanceLabel: { marginTop: 6 },
});
