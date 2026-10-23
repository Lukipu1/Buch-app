import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

import { BottomSheet } from './BottomSheet';
import { Text } from './Text';

export interface ActionSheetItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  title?: string;
  message?: string;
  actions: ActionSheetItem[];
  onClose: () => void;
}

/** Cross-platform action list in the app's sheet style. */
export function ActionSheet({ title, message, actions, onClose }: ActionSheetProps) {
  const theme = useTheme();

  return (
    <BottomSheet onClose={onClose}>
      {title ? (
        <Text variant="headline" center>
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text variant="footnote" color="textSecondary" center style={styles.message}>
          {message}
        </Text>
      ) : null}
      <View
        style={[
          styles.group,
          { backgroundColor: theme.colors.background, borderRadius: theme.radius.lg },
        ]}
      >
        {actions.map((action, index) => {
          const color = action.disabled
            ? theme.colors.textTertiary
            : action.destructive
              ? theme.colors.danger
              : theme.colors.text;
          return (
            <View key={action.label}>
              {index > 0 && (
                <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
              )}
              <Pressable
                disabled={action.disabled}
                accessibilityRole="button"
                onPress={() => {
                  haptic.selection();
                  onClose();
                  // Let the sheet close before follow-up dialogs open.
                  setTimeout(action.onPress, 250);
                }}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: theme.colors.surfacePressed },
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.destructive ? theme.colors.danger : theme.colors.accent}
                  style={styles.icon}
                />
                <Text variant="body" style={{ color }}>
                  {action.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  message: { marginTop: 4 },
  group: { marginTop: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52 },
  icon: { width: 28 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 44 },
});
