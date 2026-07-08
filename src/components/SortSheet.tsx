import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { SortOption } from '@/types/sort';
import { haptic } from '@/utils/haptics';

import { Text } from './Text';

interface SortSheetProps<T extends string> {
  title: string;
  options: SortOption<T>[];
  value: T;
  onSelect: (key: T) => void;
  onClose: () => void;
}

/**
 * Bottom sheet listing sort options with a checkmark on the active one.
 * Generic over the key type so it serves both book and page sorting.
 */
export function SortSheet<T extends string>({
  title,
  options,
  value,
  onSelect,
  onClose,
}: SortSheetProps<T>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.backgroundElevated,
              borderTopLeftRadius: theme.radius.xxl,
              borderTopRightRadius: theme.radius.xxl,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View
            style={[styles.grabber, { backgroundColor: theme.colors.separator }]}
          />
          <Text variant="headline" center style={styles.title}>
            {title}
          </Text>

          {options.map((option, index) => {
            const active = option.key === value;
            return (
              <View key={option.key}>
                {index > 0 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.separator },
                    ]}
                  />
                )}
                <Pressable
                  onPress={() => {
                    haptic.selection();
                    onSelect(option.key);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { backgroundColor: theme.colors.surfacePressed },
                  ]}
                >
                  <Text
                    variant="body"
                    color={active ? 'accent' : 'text'}
                    style={styles.rowLabel}
                  >
                    {option.label}
                  </Text>
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={theme.colors.accent}
                    />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 10 },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  rowLabel: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth },
});
