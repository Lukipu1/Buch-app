import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'tinted' | 'plain' | 'destructive';
type Size = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  fullWidth,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const { background, foreground } = resolveColors(theme, variant, isDisabled);
  const height = size === 'lg' ? 54 : 48;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: background,
          borderRadius: theme.radius.md,
          opacity: pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        variant === 'plain' && styles.plain,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 20 : 18}
              color={foreground}
              style={styles.icon}
            />
          )}
          <Text
            variant="headline"
            style={{ color: foreground }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function resolveColors(
  theme: ReturnType<typeof useTheme>,
  variant: Variant,
  disabled?: boolean,
): { background: string; foreground: string } {
  const { colors } = theme;
  const map: Record<Variant, { background: string; foreground: string }> = {
    primary: { background: colors.accent, foreground: colors.onAccent },
    secondary: { background: colors.surface, foreground: colors.text },
    tinted: { background: colors.accentMuted, foreground: colors.accent },
    plain: { background: 'transparent', foreground: colors.accent },
    destructive: { background: colors.accentMuted, foreground: colors.danger },
  };
  const resolved = map[variant];
  if (disabled) {
    return {
      background: variant === 'plain' ? 'transparent' : colors.skeleton,
      foreground: colors.textTertiary,
    };
  }
  return resolved;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  plain: {
    paddingHorizontal: 8,
    height: undefined,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
});
