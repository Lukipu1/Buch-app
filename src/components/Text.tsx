import React from 'react';
import { StyleSheet, Text as RNText, TextProps } from 'react-native';

import { useTheme } from '@/theme';
import { TypographyToken } from '@/theme/typography';

type ColorToken = 'text' | 'textSecondary' | 'textTertiary' | 'accent' | 'danger' | 'onAccent';

interface AppTextProps extends TextProps {
  variant?: TypographyToken;
  color?: ColorToken;
  center?: boolean;
}

/**
 * Typed text primitive. Every string in the app should render through this so
 * typography and colour stay consistent with the design tokens.
 */
export function Text({
  variant = 'body',
  color = 'text',
  center,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
