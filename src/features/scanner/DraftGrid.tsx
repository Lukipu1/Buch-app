import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';
import { DraftPage } from '@/types/models';
import { haptic } from '@/utils/haptics';

interface DraftGridProps {
  drafts: DraftPage[];
  header?: React.ReactNode;
  bottomInset: number;
  onOpen: (index: number) => void;
}

const SIDE_LABEL: Record<DraftPage['side'], string | null> = {
  single: null,
  left: 'Links',
  right: 'Rechts',
};

/** Grid of captured pages in reading order. */
export function DraftGrid({ drafts, header, bottomInset, onOpen }: DraftGridProps) {
  const theme = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
    >
      {header}
      <View style={styles.grid}>
        {drafts.map((draft, index) => {
          const side = SIDE_LABEL[draft.side];
          return (
            <Pressable
              key={draft.id}
              accessibilityRole="button"
              accessibilityLabel={`Seite ${index + 1} öffnen`}
              onPress={() => {
                haptic.selection();
                onOpen(index);
              }}
              style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View
                style={[
                  styles.thumb,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.md,
                    ...theme.shadows.sm,
                  },
                ]}
              >
                <Image source={{ uri: draft.imageUri }} style={styles.image} resizeMode="cover" />
                {side && (
                  <View style={[styles.sideBadge, { borderRadius: theme.radius.pill }]}>
                    <Text variant="caption" style={styles.sideText}>
                      {side}
                    </Text>
                  </View>
                )}
              </View>
              <Text variant="caption" color="textSecondary" center style={styles.number}>
                {index + 1}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { width: '30%', flexGrow: 1, maxWidth: '31.5%' },
  thumb: { aspectRatio: 3 / 4, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  sideBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sideText: { color: '#FFFFFF', fontWeight: '600' },
  number: { marginTop: 6 },
});
