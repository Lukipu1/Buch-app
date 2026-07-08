import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Text } from '@/components';
import { bookRepository } from '@/services/database';
import { useTheme } from '@/theme';
import { Book } from '@/types/models';

interface EditBookSheetProps {
  book: Book;
  onClose: () => void;
  onSaved: () => void;
}

/** Bottom sheet to edit a book's title and author. */
export function EditBookSheet({ book, onClose, onSaved }: EditBookSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author ?? '');
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    await bookRepository.update(book.id, {
      title,
      author: author.trim() || null,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
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
            Buch bearbeiten
          </Text>

          <Input
            label="Titel"
            value={title}
            onChangeText={setTitle}
            placeholder="Titel des Buchs"
            autoFocus
            containerStyle={styles.field}
          />
          <Input
            label="Autor (optional)"
            value={author}
            onChangeText={setAuthor}
            placeholder="Autor"
            containerStyle={styles.field}
          />

          <Button
            label="Speichern"
            onPress={save}
            disabled={!canSave}
            loading={saving}
            fullWidth
            style={styles.save}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 10 },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  heading: { marginBottom: 20 },
  field: { marginBottom: 16 },
  save: { marginTop: 8 },
});
