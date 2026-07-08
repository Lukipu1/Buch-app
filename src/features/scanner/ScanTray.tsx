import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { IconButton, PagePreview } from '@/components';
import { DraftPage } from '@/types/models';

interface ScanTrayProps {
  drafts: DraftPage[];
  onRemove: (id: string) => void;
  /** Reorders a draft from one position to another (manual pre-persist sort). */
  onMove: (from: number, to: number) => void;
}

/**
 * Horizontal strip of captured page thumbnails shown above the shutter.
 * Each page can be removed or nudged left/right — the manual reordering that
 * prepares the ground for full drag-and-drop.
 */
export function ScanTray({ drafts, onRemove, onMove }: ScanTrayProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {drafts.map((draft, index) => (
        <View key={draft.id} style={styles.item}>
          <PagePreview
            imageUri={draft.imageUri}
            index={index}
            onRemove={() => onRemove(draft.id)}
          />
          <View style={styles.reorder}>
            <IconButton
              icon="chevron-back"
              accessibilityLabel={`Seite ${index + 1} nach vorne`}
              onPress={() => onMove(index, index - 1)}
              size={18}
              color={index === 0 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'}
              style={styles.reorderButton}
            />
            <IconButton
              icon="chevron-forward"
              accessibilityLabel={`Seite ${index + 1} nach hinten`}
              onPress={() => onMove(index, index + 1)}
              size={18}
              color={
                index === drafts.length - 1 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'
              }
              style={styles.reorderButton}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingHorizontal: 8 },
  item: { alignItems: 'center', gap: 6 },
  reorder: { flexDirection: 'row', gap: 8 },
  reorderButton: {
    minWidth: 30,
    minHeight: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 999,
  },
});
