import React from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

import { Text } from './Text';

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** iOS-style segmented control for small mutually-exclusive choices. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.skeleton,
          borderRadius: theme.radius.sm,
        },
      ]}
    >
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            style={[
              styles.segment,
              {
                borderRadius: theme.radius.sm - 2,
                backgroundColor: active ? theme.colors.surface : 'transparent',
              },
              active && theme.shadows.sm,
            ]}
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              haptic.selection();
              onChange(segment.value);
            }}
          >
            <Text
              variant="subhead"
              style={{
                color: active ? theme.colors.text : theme.colors.textSecondary,
                fontWeight: active ? '600' : '400',
              }}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 2 },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
});
