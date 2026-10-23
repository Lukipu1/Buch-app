import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/components';
import { haptic } from '@/utils/haptics';

import { CameraPermissionGate } from './CameraPermissionGate';

interface CameraCaptureProps {
  pageCount: number;
  onCapture: (uri: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Fallback camera for builds without Apple's document scanner (Android,
 * Expo Go). Photos are passed on to the crop/split pipeline.
 */
export function CameraCapture({ pageCount, onCapture, onClose }: CameraCaptureProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  const capture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        haptic.success();
        await onCapture(photo.uri);
      }
    } catch {
      Alert.alert('Aufnahme fehlgeschlagen', 'Bitte versuche es erneut.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, onCapture]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.flex}>
        {!permission ? null : !permission.granted ? (
          <>
            <CameraPermissionGate
              denied={!permission.canAskAgain}
              onRequest={requestPermission}
            />
            <View style={[styles.topBar, { top: insets.top + 4 }]}>
              <IconButton icon="close" accessibilityLabel="Kamera schließen" onPress={onClose} tinted />
            </View>
          </>
        ) : (
          <>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

            <View style={[styles.topBar, { top: insets.top + 4 }]}>
              <IconButton
                icon="close"
                accessibilityLabel="Kamera schließen"
                onPress={onClose}
                color="#FFFFFF"
              />
              <View style={styles.counter}>
                <Text variant="footnote" style={styles.white}>
                  {pageCount} {pageCount === 1 ? 'Seite' : 'Seiten'}
                </Text>
              </View>
              <View style={styles.spacer} />
            </View>

            <View style={styles.guideWrap} pointerEvents="none">
              <View style={styles.guide}>
                <View style={styles.fold} />
              </View>
              <Text variant="footnote" style={styles.hint}>
                Aufgeschlagenes Buch im Rahmen ausrichten
              </Text>
            </View>

            <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.side} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Seite aufnehmen"
                onPress={capture}
                style={[styles.shutterOuter, capturing && styles.busy]}
              >
                <View style={styles.shutterInner} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fertig"
                onPress={onClose}
                style={styles.side}
              >
                <Text variant="headline" style={styles.white}>
                  Fertig
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000000' },
  white: { color: '#FFFFFF' },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: { width: 36 },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guide: {
    width: '88%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
  },
  fold: { width: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  hint: { color: 'rgba(255,255,255,0.9)', marginTop: 16 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  side: { width: 64, alignItems: 'center' },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF' },
  busy: { opacity: 0.5 },
});
