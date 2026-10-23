import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { haptic } from '@/utils/haptics';

interface ProgressScrubberProps {
  /** 0–1 */
  value: number;
  color: string;
  trackColor: string;
  /** Label shown above the thumb while dragging. */
  previewLabel: (value: number) => string;
  onComplete: (value: number) => void;
}

/** Draggable progress bar for jumping through the book. */
export function ProgressScrubber({
  value,
  color,
  trackColor,
  previewLabel,
  onComplete,
}: ProgressScrubberProps) {
  const [width, setWidth] = useState(0);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const widthRef = useRef(0);
  const callbacks = useRef({ onComplete });
  callbacks.current = { onComplete };

  const responder = useMemo(() => {
    let startX = 0;
    const valueAt = (x: number) =>
      widthRef.current > 0 ? Math.max(0, Math.min(1, x / widthRef.current)) : 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        haptic.selection();
        startX = e.nativeEvent.locationX;
        setDragValue(valueAt(startX));
      },
      onPanResponderMove: (_, gesture) => setDragValue(valueAt(startX + gesture.dx)),
      onPanResponderRelease: (_, gesture) => {
        const next = valueAt(startX + gesture.dx);
        setDragValue(null);
        callbacks.current.onComplete(next);
      },
      onPanResponderTerminate: () => setDragValue(null),
    });
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const shown = dragValue ?? value;
  const thumbX = shown * width;

  return (
    <View style={styles.container}>
      {dragValue !== null && (
        <View
          pointerEvents="none"
          style={[
            styles.bubble,
            { left: Math.max(0, Math.min(width - 120, thumbX - 60)), backgroundColor: color },
          ]}
        >
          <Text variant="footnote" style={styles.bubbleText} numberOfLines={1}>
            {previewLabel(dragValue)}
          </Text>
        </View>
      )}
      <View
        style={styles.hitArea}
        onLayout={onLayout}
        {...responder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel="Lesefortschritt"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      >
        <View pointerEvents="none" style={[styles.track, { backgroundColor: trackColor }]}>
          <View style={[styles.fill, { width: thumbX, backgroundColor: color }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: thumbX - 9,
              backgroundColor: color,
              transform: [{ scale: dragValue !== null ? 1.25 : 1 }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 30, justifyContent: 'center' },
  hitArea: { height: 30, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4 },
  thumb: { position: 'absolute', width: 18, height: 18, borderRadius: 9, top: 6 },
  bubble: {
    position: 'absolute',
    bottom: 34,
    width: 120,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  bubbleText: { color: '#FFFFFF', fontWeight: '600' },
});
