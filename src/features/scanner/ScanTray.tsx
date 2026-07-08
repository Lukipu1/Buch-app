import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { PagePreview } from '@/components';
import { DraftPage } from '@/types/models';

interface ScanTrayProps {
  drafts: DraftPage[];
  onRemove: (id: string) => void;
}

/** Horizontal strip of captured page thumbnails shown above the shutter. */
export function ScanTray({ drafts, onRemove }: ScanTrayProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {drafts.map((draft, index) => (
        <PagePreview
          key={draft.id}
          imageUri={draft.imageUri}
          index={index}
          onRemove={() => onRemove(draft.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingHorizontal: 8 },
});
