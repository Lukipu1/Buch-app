import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { IconButton } from './IconButton';
import { Text } from './Text';

interface PagePreviewProps {
  imageUri: string;
  index: number;
  onRemove?: () => void;
  onPress?: () => void;
}

/** Thumbnail of a scanned page with an optional remove control. */
export function PagePreview({
  imageUri,
  index,
  onRemove,
  onPress,
}: PagePreviewProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.frame,
          {
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            ...theme.shadows.sm,
          },
        ]}
      >
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.text,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Text variant="caption" style={{ color: theme.colors.background }}>
            {index + 1}
          </Text>
        </View>
        {onRemove && (
          <View style={styles.remove}>
            <IconButton
              icon="close-circle"
              accessibilityLabel={`Seite ${index + 1} entfernen`}
              onPress={onRemove}
              size={26}
              color={theme.colors.danger}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 110 },
  frame: { aspectRatio: 3 / 4, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  remove: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
});
