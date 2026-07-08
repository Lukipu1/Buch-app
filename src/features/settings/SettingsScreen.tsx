import Constants from 'expo-constants';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppHeader,
  IconButton,
  SegmentedControl,
  Text,
} from '@/components';
import { getDatabase } from '@/services/database';
import { imageStorage } from '@/services/storage/imageStorage';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';
import { OcrLanguage, ThemePreference } from '@/types/models';
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

const LANGUAGES: { value: OcrLanguage; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'Englisch' },
  { value: 'fr', label: 'Französisch' },
  { value: 'es', label: 'Spanisch' },
  { value: 'it', label: 'Italienisch' },
];

export function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

  const [usage, setUsage] = useState<{ bytes: number; books: number } | null>(null);

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

  const cycleLanguage = () => {
    const idx = LANGUAGES.findIndex((l) => l.value === settings.ocrLanguage);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    void update({ ocrLanguage: next.value });
  };

  const languageLabel =
    LANGUAGES.find((l) => l.value === settings.ocrLanguage)?.label ?? 'Deutsch';

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <AppHeader title="Einstellungen" />
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
          title="Reader"
          footer="Diese Schriftgröße wird beim Öffnen eines Buchs verwendet."
        >
          <View style={styles.block}>
            <View style={styles.fontRow}>
              <Text variant="subhead" color="textSecondary">
                Standardschriftgröße
              </Text>
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
        </SettingsSection>

        <SettingsSection
          title="Texterkennung (OCR)"
          footer="Die Sprache verbessert die Erkennungsgenauigkeit. Aktuell wird ein Platzhalter-Provider verwendet."
        >
          <SettingsRow
            icon="language-outline"
            label="OCR-Sprache"
            value={languageLabel}
            onPress={cycleLanguage}
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16 },
  block: { padding: 14 },
  blockLabel: { marginBottom: 10 },
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
