import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { AppButton, BottomSheet, Input, Text } from '@/components';
import { isOcrAvailable } from '@/services/ocr';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useScannerStore } from '@/store/useScannerStore';
import { useTheme } from '@/theme';
import { formatPageCount } from '@/utils/format';
import { haptic } from '@/utils/haptics';

interface SaveScanSheetProps {
  targetBookId?: string;
  targetTitle?: string;
  onClose: () => void;
  onSaved: (bookId: string) => void;
}

/**
 * Confirmation sheet before persisting a scan. For a new book it asks for
 * title and author; when appending to an existing book it just confirms.
 * Saving is instant — text recognition continues in the background.
 */
export function SaveScanSheet({
  targetBookId,
  targetTitle,
  onClose,
  onSaved,
}: SaveScanSheetProps) {
  const theme = useTheme();
  const drafts = useScannerStore((s) => s.drafts);
  const saving = useScannerStore((s) => s.saving);
  const commit = useScannerStore((s) => s.commit);
  const refreshLibrary = useLibraryStore((s) => s.refresh);

  const isNewBook = !targetBookId;
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const canSave =
    drafts.length > 0 && (!isNewBook || title.trim().length > 0) && !saving;

  const save = async () => {
    if (!canSave) return;
    try {
      const bookId = await commit({ targetBookId, title, author });
      haptic.success();
      await refreshLibrary();
      onSaved(bookId);
    } catch (error) {
      Alert.alert(
        'Speichern fehlgeschlagen',
        error instanceof Error ? error.message : 'Unbekannter Fehler.',
      );
    }
  };

  const ocrHint = isOcrAvailable()
    ? 'Der Text wird anschließend im Hintergrund erkannt.'
    : '';

  return (
    <BottomSheet onClose={onClose} locked={saving}>
      <Text variant="title3" style={styles.heading}>
        {isNewBook ? 'Neues Buch' : 'Seiten hinzufügen'}
      </Text>
      <Text variant="subhead" color="textSecondary" style={styles.subheading}>
        {isNewBook
          ? `${formatPageCount(drafts.length)} werden als neues Buch gespeichert. ${ocrHint}`
          : `${formatPageCount(drafts.length)} werden an „${targetTitle ?? 'dieses Buch'}“ angehängt. ${ocrHint}`}
      </Text>

      {isNewBook && (
        <>
          <Input
            label="Titel"
            value={title}
            onChangeText={setTitle}
            placeholder="Titel des Buchs"
            autoFocus
            editable={!saving}
            returnKeyType="next"
            containerStyle={styles.field}
          />
          <Input
            label="Autor (optional)"
            value={author}
            onChangeText={setAuthor}
            placeholder="Autor"
            editable={!saving}
            returnKeyType="done"
            onSubmitEditing={save}
            containerStyle={styles.field}
          />
        </>
      )}

      {saving ? (
        <View style={styles.savingRow}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text variant="subhead" color="textSecondary" style={styles.savingText}>
            Seiten werden gespeichert …
          </Text>
        </View>
      ) : (
        <AppButton
          label={isNewBook ? 'Buch speichern' : 'Hinzufügen'}
          icon="checkmark"
          size="lg"
          onPress={save}
          disabled={!canSave}
          fullWidth
          style={styles.save}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: 6 },
  subheading: { marginBottom: 20 },
  field: { marginBottom: 16 },
  save: { marginTop: 4 },
  savingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  savingText: { marginLeft: 12, flex: 1 },
});
