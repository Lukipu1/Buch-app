import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionSheet,
  AppHeader,
  IconButton,
  SegmentedControl,
  Text,
} from '@/components';
import { getDatabase } from '@/services/database';
import { getOcrProvider } from '@/services/ocr';
import { imageProcessing } from '@/services/scanner/imageProcessing';
import { imageStorage } from '@/services/storage/imageStorage';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';
import { OcrLanguage, SplitMode, ThemePreference } from '@/types/models';
import { formatBytes } from '@/utils/bytes';
import {
  READER_FONT_MAX,
  READER_FONT_MIN,
} from '@/features/reader/readerTheme';

import { SettingsRow } from './SettingsRow';
import { SettingsSection } from './SettingsSection';

const THEME_SEGMENTS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

const SPLIT_SEGMENTS: { value: SplitMode; label: string }[] = [
  { value: 'auto', label: 'Automatisch' },
  { value: 'always', label: 'Immer' },
  { value: 'never', label: 'Nie' },
];

const LANGUAGES: { value: OcrLanguage; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'Englisch' },
  { value: 'fr', label: 'Französisch' },
  { value: 'es', label: 'Spanisch' },
  { value: 'it', label: 'Italienisch' },
];

export function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

  const [usage, setUsage] = useState<{ bytes: number; books: number } | null>(null);
  const [languagePicker, setLanguagePicker] = useState(false);
  const hasDocumentCamera = imageProcessing.hasDocumentCamera();
  const ocrProvider = getOcrProvider();

  const loadUsage = useCallback(async () => {
    const [bytes, db] = await Promise.all([
      imageStorage.usageBytes(),
      getDatabase(),
    ]);
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM books;',
    );
    setUsage({ bytes, books: row?.count ?? 0 });
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  const languageLabel =
    LANGUAGES.find((l) => l.value === settings.ocrLanguage)?.label ?? 'Deutsch';

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <AppHeader
          title="Einstellungen"
          left={
            <IconButton
              icon="chevron-back"
              accessibilityLabel="Zurück"
              onPress={() => router.back()}
              style={styles.back}
            />
          }
        />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        <SettingsSection title="Darstellung">
          <View style={styles.block}>
            <Text variant="subhead" color="textSecondary" style={styles.blockLabel}>
              Erscheinungsbild
            </Text>
            <SegmentedControl
              segments={THEME_SEGMENTS}
              value={settings.theme}
              onChange={(value) => update({ theme: value })}
            />
          </View>
        </SettingsSection>

        <SettingsSection
          title="Lesen"
          footer="Schrift, Hintergrund und Layout stellst du direkt im Reader über „Aa“ ein."
        >
          <View style={styles.block}>
            <View style={styles.fontRow}>
              <Text variant="body">Schriftgröße</Text>
              <View style={styles.stepper}>
                <IconButton
                  icon="remove"
                  accessibilityLabel="Kleiner"
                  onPress={() =>
                    update({
                      readerFontSize: Math.max(
                        READER_FONT_MIN,
                        settings.readerFontSize - 1,
                      ),
                    })
                  }
                />
                <Text variant="headline" style={styles.fontValue}>
                  {settings.readerFontSize}
                </Text>
                <IconButton
                  icon="add"
                  accessibilityLabel="Größer"
                  onPress={() =>
                    update({
                      readerFontSize: Math.min(
                        READER_FONT_MAX,
                        settings.readerFontSize + 1,
                      ),
                    })
                  }
                />
              </View>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
          <SettingsRow
            icon="sunny-outline"
            label="Display aktiv lassen"
            right={
              <Switch
                value={settings.keepScreenAwake}
                onValueChange={(value) => update({ keepScreenAwake: value })}
                trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
              />
            }
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title="Scannen"
          footer={
            hasDocumentCamera
              ? 'Der Apple-Dokumentenscanner erkennt Seitenränder, entzerrt und schneidet automatisch zu. Doppelseiten werden an der Buchmitte getrennt.'
              : 'Der Apple-Dokumentenscanner ist nur in der iOS-App verfügbar (nicht in Expo Go). Bis dahin wird die Kamera verwendet.'
          }
        >
          <SettingsRow
            icon="scan-outline"
            label="Scanner"
            value={hasDocumentCamera ? 'Apple VisionKit' : 'Kamera'}
          />
          <View style={styles.block}>
            <Text variant="body" style={styles.blockLabel}>
              Doppelseiten trennen
            </Text>
            <SegmentedControl
              segments={SPLIT_SEGMENTS}
              value={settings.scanSplitMode}
              onChange={(value) => update({ scanSplitMode: value })}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
          <SettingsRow
            icon="crop-outline"
            label="Fotos automatisch zuschneiden"
            right={
              <Switch
                value={settings.scanAutoCrop}
                onValueChange={(value) => update({ scanAutoCrop: value })}
                trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
              />
            }
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title="Texterkennung (OCR)"
          footer="Der Text wird vollständig auf dem Gerät erkannt und ermöglicht den Textmodus und die Volltextsuche. Die Sprache verbessert die Genauigkeit."
        >
          <SettingsRow
            icon="sparkles-outline"
            label="Engine"
            value={ocrProvider.displayName}
          />
          <SettingsRow
            icon="language-outline"
            label="Sprache"
            value={languageLabel}
            onPress={() => setLanguagePicker(true)}
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title="Speicher"
          footer="Alle Scans werden ausschließlich lokal auf diesem Gerät gespeichert."
        >
          <SettingsRow
            icon="images-outline"
            label="Gescannte Seiten"
            value={usage ? formatBytes(usage.bytes) : '…'}
          />
          <SettingsRow
            icon="library-outline"
            label="Bücher"
            value={usage ? String(usage.books) : '…'}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Rechtliches">
          <View style={styles.legal}>
            <Text variant="footnote" color="textSecondary" style={styles.legalText}>
              Digitalisiere nur Inhalte, für die du die entsprechenden
              Nutzungsrechte besitzt. Buch ist für persönliche Sicherungskopien
              und eigene Aufzeichnungen gedacht. Für urheberrechtlich geschützte
              Werke ohne Erlaubnis übernimmt die App keine Verantwortung.
            </Text>
          </View>
        </SettingsSection>

        <Text variant="caption" color="textTertiary" center style={styles.version}>
          Buch {Constants.expoConfig?.version ?? '1.0.0'} · Lokal-first
        </Text>
      </ScrollView>

      {languagePicker && (
        <ActionSheet
          title="Sprache der Texterkennung"
          actions={LANGUAGES.map((language) => ({
            label: language.label,
            icon:
              language.value === settings.ocrLanguage ? 'checkmark-circle' : 'ellipse-outline',
            onPress: () => void update({ ocrLanguage: language.value }),
          }))}
          onClose={() => setLanguagePicker(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { marginLeft: -10, marginRight: 4 },
  content: { padding: 16 },
  block: { padding: 14 },
  blockLabel: { marginBottom: 10 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 14 },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  fontValue: { minWidth: 32, textAlign: 'center' },
  legal: { padding: 14 },
  legalText: { lineHeight: 19 },
  version: { marginTop: 8 },
});
