import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

interface ProgressBarProps {
  /** 0–1 fraction. */
  progress: number;
  height?: number;
}

export function ProgressBar({ progress, height = 6 }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.skeleton,
        },
      ]}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.accent,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
