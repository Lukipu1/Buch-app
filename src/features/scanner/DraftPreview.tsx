import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/components';
import { imageProcessing } from '@/services/scanner/imageProcessing';
import { useScannerStore } from '@/store/useScannerStore';
import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

interface DraftPreviewProps {
  initialIndex: number;
  onClose: () => void;
}

/** Full-screen review of a captured page with split/rotate/move/delete tools. */
export function DraftPreview({ initialIndex, onClose }: DraftPreviewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const drafts = useScannerStore((s) => s.drafts);
  const removeDraft = useScannerStore((s) => s.removeDraft);
  const replaceDraft = useScannerStore((s) => s.replaceDraft);
  const moveDraft = useScannerStore((s) => s.moveDraft);

  const [index, setIndex] = useState(initialIndex);
  const [busy, setBusy] = useState(false);

  const safeIndex = Math.min(index, drafts.length - 1);
  const draft = drafts[safeIndex];
  if (!draft) return null;

  const run = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
      haptic.success();
    } catch (error) {
      Alert.alert(
        'Bearbeitung fehlgeschlagen',
        error instanceof Error ? error.message : 'Bitte versuche es erneut.',
      );
    } finally {
      setBusy(false);
    }
  };

  const split = () =>
    run(async () => {
      const parts = await imageProcessing.split(draft.imageUri);
      replaceDraft(draft.id, parts);
    });

  const rotate = () =>
    run(async () => {
      const rotated = await imageProcessing.rotate(draft.imageUri);
      replaceDraft(draft.id, [{ ...rotated, side: draft.side }]);
    });

  const move = (delta: -1 | 1) => {
    const target = safeIndex + delta;
    if (target < 0 || target >= drafts.length) return;
    haptic.selection();
    moveDraft(safeIndex, target);
    setIndex(target);
  };

  const remove = () => {
    haptic.warning();
    removeDraft(draft.id);
    if (drafts.length <= 1) onClose();
    else setIndex(Math.max(0, Math.min(safeIndex, drafts.length - 2)));
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose}>
      <View
        style={[
          styles.flex,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <IconButton icon="close" accessibilityLabel="Schließen" onPress={onClose} />
          <Text variant="headline">
            Seite {safeIndex + 1} von {drafts.length}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.stage}>
          <View
            style={[
              styles.paper,
              { backgroundColor: theme.colors.surface, ...theme.shadows.lg },
            ]}
          >
            <Image source={{ uri: draft.imageUri }} style={styles.image} resizeMode="contain" />
            {busy && (
              <View style={styles.busy}>
                <ActivityIndicator color={theme.colors.accent} />
              </View>
            )}
          </View>

          <NavArrow
            side="left"
            disabled={safeIndex === 0}
            onPress={() => setIndex(safeIndex - 1)}
          />
          <NavArrow
            side="right"
            disabled={safeIndex >= drafts.length - 1}
            onPress={() => setIndex(safeIndex + 1)}
          />
        </View>

        <View
          style={[
            styles.toolbar,
            {
              paddingBottom: insets.bottom + 12,
              borderTopColor: theme.colors.separator,
              backgroundColor: theme.colors.backgroundElevated,
            },
          ]}
        >
          <Tool icon="cut-outline" label="Teilen" onPress={split} disabled={busy} />
          <Tool icon="refresh-outline" label="Drehen" onPress={rotate} disabled={busy} />
          <Tool
            icon="arrow-back-outline"
            label="Früher"
            onPress={() => move(-1)}
            disabled={busy || safeIndex === 0}
          />
          <Tool
            icon="arrow-forward-outline"
            label="Später"
            onPress={() => move(1)}
            disabled={busy || safeIndex >= drafts.length - 1}
          />
          <Tool icon="trash-outline" label="Löschen" onPress={remove} disabled={busy} destructive />
        </View>
      </View>
    </Modal>
  );
}

function NavArrow({
  side,
  disabled,
  onPress,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  if (disabled) return null;
  return (
    <Pressable
      accessibilityLabel={side === 'left' ? 'Vorherige Seite' : 'Nächste Seite'}
      onPress={onPress}
      hitSlop={12}
      style={[
        styles.arrow,
        side === 'left' ? styles.arrowLeft : styles.arrowRight,
        { backgroundColor: theme.colors.surface, ...theme.shadows.md },
      ]}
    >
      <Ionicons
        name={side === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={theme.colors.text}
      />
    </Pressable>
  );
}

function Tool({
  icon,
  label,
  onPress,
  disabled,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const theme = useTheme();
  const color = disabled
    ? theme.colors.textTertiary
    : destructive
      ? theme.colors.danger
      : theme.colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.tool, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text variant="caption" style={[styles.toolLabel, { color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSpacer: { width: 36 },
  stage: { flex: 1, padding: 24, justifyContent: 'center' },
  paper: { flex: 1, borderRadius: 6, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  busy: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    width: 36,
    height: 36,
    marginTop: -18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tool: { alignItems: 'center', minWidth: 60, paddingVertical: 4 },
  toolLabel: { marginTop: 4 },
});
