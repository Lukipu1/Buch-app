import React, { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';

import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

/** Rounded text field matching iOS grouped form styling. */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, icon, containerStyle, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="footnote" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            borderColor: theme.colors.separator,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={theme.colors.textTertiary}
            style={styles.icon}
          />
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textTertiary}
          style={[theme.typography.body, styles.input, { color: theme.colors.text }]}
          {...rest}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: 6, marginLeft: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10 },
});
