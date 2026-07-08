import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/components';
import { useScannerStore } from '@/store/useScannerStore';
import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

import { CameraPermissionGate } from './CameraPermissionGate';
import { ScanTray } from './ScanTray';
import { SaveScanSheet } from './SaveScanSheet';

interface ScannerScreenProps {
  /** When set, scanned pages are appended to this existing book. */
  targetBookId?: string;
}

export function ScannerScreen({ targetBookId }: ScannerScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const drafts = useScannerStore((s) => s.drafts);
  const addDraft = useScannerStore((s) => s.addDraft);
  const removeDraft = useScannerStore((s) => s.removeDraft);
  const reset = useScannerStore((s) => s.reset);

  const close = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  const capture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        haptic.success();
        addDraft(photo.uri);
      }
    } catch {
      Alert.alert('Aufnahme fehlgeschlagen', 'Bitte versuche es erneut.');
    } finally {
      setCapturing(false);
    }
  }, [addDraft, capturing]);

  const importFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      result.assets.forEach((asset) => addDraft(asset.uri));
      haptic.selection();
    }
  }, [addDraft]);

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.flex}>
        <CameraPermissionGate
          denied={!permission.canAskAgain}
          onRequest={requestPermission}
        />
        <View style={[styles.gateActions, { top: insets.top + 4 }]}>
          <IconButton
            icon="close"
            accessibilityLabel="Scanner schließen"
            onPress={close}
            tinted
          />
        </View>
        {!permission.canAskAgain && (
          <View style={[styles.galleryFallback, { bottom: insets.bottom + 24 }]}>
            <IconButton
              icon="images-outline"
              accessibilityLabel="Aus Galerie importieren"
              onPress={importFromGallery}
              tinted
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + 4 }]}>
        <IconButton
          icon="close"
          accessibilityLabel="Scanner schließen"
          onPress={close}
          color="#FFFFFF"
        />
        <View style={styles.counter}>
          <Text variant="footnote" style={styles.counterText}>
            {drafts.length} {drafts.length === 1 ? 'Seite' : 'Seiten'}
          </Text>
        </View>
        <View style={styles.topSpacer} />
      </View>

      {/* Guide frame */}
      <View style={styles.guideWrap} pointerEvents="none">
        <View style={styles.guide} />
        <Text variant="footnote" style={styles.guideHint}>
          Seite im Rahmen ausrichten
        </Text>
      </View>

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
        {drafts.length > 0 && (
          <ScanTray drafts={drafts} onRemove={removeDraft} />
        )}
        <View style={styles.shutterRow}>
          <IconButton
            icon="images-outline"
            accessibilityLabel="Aus Galerie importieren"
            onPress={importFromGallery}
            size={26}
            color="#FFFFFF"
            style={styles.sideButton}
          />
          <ShutterButton onPress={capture} busy={capturing} />
          <IconButton
            icon="checkmark"
            accessibilityLabel="Scan abschließen"
            onPress={() => setReviewing(true)}
            size={26}
            color={drafts.length > 0 ? theme.colors.success : 'rgba(255,255,255,0.4)'}
            style={styles.sideButton}
          />
        </View>
      </View>

      {reviewing && (
        <SaveScanSheet
          targetBookId={targetBookId}
          onClose={() => setReviewing(false)}
          onSaved={(bookId) => {
            setReviewing(false);
            router.replace(`/book/${bookId}`);
          }}
        />
      )}
    </View>
  );
}

function ShutterButton({ onPress, busy }: { onPress: () => void; busy: boolean }) {
  return (
    <View style={[styles.shutterOuter, busy && styles.shutterBusy]}>
      <IconButton
        icon="ellipse"
        accessibilityLabel="Seite aufnehmen"
        onPress={onPress}
        size={64}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000000' },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topSpacer: { width: 36 },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  counterText: { color: '#FFFFFF' },
  guideWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    width: '78%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  guideHint: { color: 'rgba(255,255,255,0.85)', marginTop: 16 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    gap: 16,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  sideButton: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999,
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBusy: { opacity: 0.5 },
  gateActions: { position: 'absolute', left: 12 },
  galleryFallback: { position: 'absolute', alignSelf: 'center' },
});
