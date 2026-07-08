import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Text } from '@/components';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useScannerStore } from '@/store/useScannerStore';
import { useTheme } from '@/theme';

interface SaveScanSheetProps {
  targetBookId?: string;
  onClose: () => void;
  onSaved: (bookId: string) => void;
}

/**
 * Confirmation sheet before persisting a scan. For a new book it asks for a
 * title; when appending to an existing book it just confirms. OCR runs during
 * `commit`, so a progress indicator is shown while saving.
 */
export function SaveScanSheet({
  targetBookId,
  onClose,
  onSaved,
}: SaveScanSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const drafts = useScannerStore((s) => s.drafts);
  const saving = useScannerStore((s) => s.saving);
  const commit = useScannerStore((s) => s.commit);
  const refreshLibrary = useLibraryStore((s) => s.refresh);

  const isNewBook = !targetBookId;
  const [title, setTitle] = useState('');

  const canSave =
    drafts.length > 0 && (!isNewBook || title.trim().length > 0) && !saving;

  const save = async () => {
    if (!canSave) return;
    try {
      const bookId = await commit({ targetBookId, title });
      await refreshLibrary();
      onSaved(bookId);
    } catch (error) {
      Alert.alert(
        'Speichern fehlgeschlagen',
        error instanceof Error ? error.message : 'Unbekannter Fehler.',
      );
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={saving ? undefined : onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.backgroundElevated,
              borderTopLeftRadius: theme.radius.xxl,
              borderTopRightRadius: theme.radius.xxl,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View
            style={[styles.grabber, { backgroundColor: theme.colors.separator }]}
          />

          <Text variant="title3" style={styles.heading}>
            {isNewBook ? 'Neues Buch speichern' : 'Seiten hinzufügen'}
          </Text>
          <Text variant="subhead" color="textSecondary" style={styles.subheading}>
            {drafts.length} {drafts.length === 1 ? 'Seite' : 'Seiten'} werden
            {isNewBook ? ' als neues Buch gespeichert.' : ' zum Buch hinzugefügt.'}
            {' '}Text wird automatisch erkannt.
          </Text>

          {isNewBook && (
            <Input
              label="Titel"
              value={title}
              onChangeText={setTitle}
              placeholder="Titel des Buchs"
              autoFocus
              editable={!saving}
              containerStyle={styles.field}
            />
          )}

          {saving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text variant="subhead" color="textSecondary" style={styles.savingText}>
                Seiten werden gespeichert und Text erkannt …
              </Text>
            </View>
          ) : (
            <Button
              label={isNewBook ? 'Buch speichern' : 'Hinzufügen'}
              icon="checkmark"
              onPress={save}
              disabled={!canSave}
              fullWidth
              style={styles.save}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 10 },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  heading: { marginBottom: 6 },
  subheading: { marginBottom: 20 },
  field: { marginBottom: 20 },
  save: { marginTop: 4 },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  savingText: { marginLeft: 12, flex: 1 },
});
