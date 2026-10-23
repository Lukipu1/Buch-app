import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton, SegmentedControl, Text, confirm } from '@/components';
import { bookRepository } from '@/services/database';
import { ProcessedImage, imageProcessing } from '@/services/scanner/imageProcessing';
import { useScannerStore } from '@/store/useScannerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';
import { SplitMode } from '@/types/models';
import { formatPageCount } from '@/utils/format';
import { haptic } from '@/utils/haptics';

import { CameraCapture } from './CameraCapture';
import { DraftGrid } from './DraftGrid';
import { DraftPreview } from './DraftPreview';
import { SaveScanSheet } from './SaveScanSheet';

interface ScannerScreenProps {
  /** When set, scanned pages are appended to this existing book. */
  targetBookId?: string;
}

const SPLIT_SEGMENTS: { value: SplitMode; label: string }[] = [
  { value: 'auto', label: 'Automatisch' },
  { value: 'always', label: 'Immer' },
  { value: 'never', label: 'Nie' },
];

/**
 * Scan session. On iOS Apple's VisionKit document camera opens right away: it
 * finds the page edges, corrects perspective and crops. Every double-page
 * spread is then split at the fold so each book page becomes its own page.
 * Pages can be reviewed, split, rotated, reordered and removed before saving.
 */
export function ScannerScreen({ targetBookId }: ScannerScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const drafts = useScannerStore((s) => s.drafts);
  const addDrafts = useScannerStore((s) => s.addDrafts);
  const reset = useScannerStore((s) => s.reset);
  const splitMode = useSettingsStore((s) => s.settings.scanSplitMode);
  const autoCrop = useSettingsStore((s) => s.settings.scanAutoCrop);
  const updateSettings = useSettingsStore((s) => s.update);

  const hasDocumentCamera = useMemo(() => imageProcessing.hasDocumentCamera(), []);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [targetTitle, setTargetTitle] = useState<string | undefined>();

  useEffect(() => {
    if (!targetBookId) return;
    void bookRepository.getById(targetBookId).then((b) => setTargetTitle(b?.title));
  }, [targetBookId]);

  const addProcessed = useCallback(
    (images: ProcessedImage[]) => {
      if (images.length === 0) return;
      haptic.success();
      addDrafts(images);
    },
    [addDrafts],
  );

  const startScan = useCallback(async () => {
    if (!hasDocumentCamera) {
      setCameraOpen(true);
      return;
    }
    try {
      const pages = await imageProcessing.scanWithDocumentCamera({ splitMode, autoCrop: false });
      addProcessed(pages);
    } catch (error) {
      Alert.alert(
        'Scan fehlgeschlagen',
        error instanceof Error ? error.message : 'Bitte versuche es erneut.',
      );
    }
  }, [addProcessed, hasDocumentCamera, splitMode]);

  // Open Apple's scanner immediately, once the modal transition has finished.
  const startScanRef = useRef(startScan);
  startScanRef.current = startScan;
  useEffect(() => {
    if (!hasDocumentCamera) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => void startScanRef.current(), 250);
    });
    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [hasDocumentCamera]);

  const processUris = useCallback(
    async (uris: string[], label: string) => {
      setBusyLabel(label);
      try {
        for (const uri of uris) {
          addProcessed(await imageProcessing.process(uri, { splitMode, autoCrop }));
        }
      } catch (error) {
        Alert.alert(
          'Verarbeitung fehlgeschlagen',
          error instanceof Error ? error.message : 'Bitte versuche es erneut.',
        );
      } finally {
        setBusyLabel(null);
      }
    },
    [addProcessed, autoCrop, splitMode],
  );

  const importPhotos = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: 0,
      quality: 1,
    });
    if (result.canceled) return;
    await processUris(
      result.assets.map((a) => a.uri),
      'Fotos werden zugeschnitten …',
    );
  }, [processUris]);

  const close = useCallback(async () => {
    if (drafts.length > 0) {
      const ok = await confirm({
        title: 'Scan verwerfen?',
        message: `${formatPageCount(drafts.length)} wurden noch nicht gespeichert.`,
        confirmLabel: 'Verwerfen',
        destructive: true,
      });
      if (!ok) return;
    }
    reset();
    router.back();
  }, [drafts.length, reset, router]);

  const hasDrafts = drafts.length > 0;
  const subtitle = hasDrafts
    ? `${formatPageCount(drafts.length)} · ${targetTitle ? `für „${targetTitle}“` : 'Neues Buch'}`
    : targetTitle
      ? `Seiten für „${targetTitle}“`
      : 'Neues Buch';

  const splitControl = (
    <View
      style={[
        styles.optionCard,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg },
      ]}
    >
      <View style={styles.optionHeader}>
        <Ionicons name="book-outline" size={18} color={theme.colors.accent} />
        <Text variant="subhead" style={styles.optionTitle}>
          Doppelseiten trennen
        </Text>
      </View>
      <SegmentedControl
        segments={SPLIT_SEGMENTS}
        value={splitMode}
        onChange={(value) => void updateSettings({ scanSplitMode: value })}
      />
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" onPress={close} hitSlop={10} style={styles.headerSide}>
          <Text variant="body" color="accent">
            Abbrechen
          </Text>
        </Pressable>
        <View style={styles.headerTitle}>
          <Text variant="headline" numberOfLines={1}>
            Scannen
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!hasDrafts}
          onPress={() => setReviewing(true)}
          hitSlop={10}
          style={[styles.headerSide, styles.headerRight]}
        >
          <Text
            variant="headline"
            style={{ color: hasDrafts ? theme.colors.accent : theme.colors.textTertiary }}
          >
            Sichern
          </Text>
        </Pressable>
      </View>

      {hasDrafts ? (
        <DraftGrid
          drafts={drafts}
          header={<View style={styles.gridHeader}>{splitControl}</View>}
          bottomInset={insets.bottom + 110}
          onOpen={setPreviewIndex}
        />
      ) : (
        <View style={styles.intro}>
          <View
            style={[
              styles.introIcon,
              { backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.xxl },
            ]}
          >
            <Ionicons name="scan-outline" size={44} color={theme.colors.accent} />
          </View>
          <Text variant="title2" center style={styles.introTitle}>
            Buchseiten scannen
          </Text>
          <Text variant="callout" color="textSecondary" center style={styles.introText}>
            Halte die Kamera über das aufgeschlagene Buch. Ränder werden automatisch
            erkannt, gerade gerückt und zugeschnitten – jede Seite wird einzeln
            gespeichert, auch bei Doppelseiten.
          </Text>
          <View style={styles.introOptions}>{splitControl}</View>
          <AppButton
            label={hasDocumentCamera ? 'Scanner öffnen' : 'Kamera öffnen'}
            icon="scan"
            size="lg"
            fullWidth
            onPress={startScan}
          />
          <AppButton
            label="Aus Fotos importieren"
            icon="images-outline"
            variant="plain"
            onPress={importPhotos}
            style={styles.introSecondary}
          />
        </View>
      )}

      {hasDrafts && (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: theme.colors.backgroundElevated,
              borderTopColor: theme.colors.separator,
            },
          ]}
        >
          <IconButton
            icon="images-outline"
            accessibilityLabel="Aus Fotos importieren"
            onPress={importPhotos}
            size={24}
            tinted
            style={styles.bottomIcon}
          />
          <AppButton
            label="Weitere Seiten scannen"
            icon="scan"
            onPress={startScan}
            style={styles.bottomPrimary}
          />
        </View>
      )}

      {busyLabel && (
        <View style={styles.busyOverlay}>
          <View
            style={[
              styles.busyCard,
              { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, ...theme.shadows.lg },
            ]}
          >
            <ActivityIndicator color={theme.colors.accent} />
            <Text variant="subhead" color="textSecondary" style={styles.busyText}>
              {busyLabel}
            </Text>
          </View>
        </View>
      )}

      {cameraOpen && (
        <CameraCapture
          pageCount={drafts.length}
          onCapture={async (uri) => {
            addProcessed(await imageProcessing.process(uri, { splitMode, autoCrop: false }));
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}

      {previewIndex !== null && (
        <DraftPreview initialIndex={previewIndex} onClose={() => setPreviewIndex(null)} />
      )}

      {reviewing && (
        <SaveScanSheet
          targetBookId={targetBookId}
          targetTitle={targetTitle}
          onClose={() => setReviewing(false)}
          onSaved={(bookId) => {
            setReviewing(false);
            if (targetBookId) router.back();
            else router.replace(`/book/${bookId}`);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerSide: { width: 90 },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { flex: 1, alignItems: 'center' },
  gridHeader: { marginBottom: 16 },
  optionCard: { padding: 14, gap: 10 },
  optionHeader: { flexDirection: 'row', alignItems: 'center' },
  optionTitle: { marginLeft: 8, fontWeight: '600' },
  intro: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 40 },
  introIcon: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: { marginTop: 24 },
  introText: { marginTop: 10, lineHeight: 22 },
  introOptions: { marginTop: 28, marginBottom: 20 },
  introSecondary: { marginTop: 8, alignSelf: 'center', height: 44 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomIcon: { width: 48, height: 48 },
  bottomPrimary: { flex: 1 },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  busyCard: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  busyText: { marginLeft: 12 },
});
