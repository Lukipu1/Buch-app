import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppButton, BottomSheet, Input, Text } from '@/components';
import { bookRepository } from '@/services/database';
import { Book } from '@/types/models';

interface EditBookSheetProps {
  book: Book;
  onClose: () => void;
  onSaved: () => void;
}

/** Bottom sheet to edit a book's title and author. */
export function EditBookSheet({ book, onClose, onSaved }: EditBookSheetProps) {
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
    <BottomSheet onClose={onClose} locked={saving}>
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
        returnKeyType="done"
        onSubmitEditing={save}
        containerStyle={styles.field}
      />

      <AppButton
        label="Speichern"
        onPress={save}
        disabled={!canSave}
        loading={saving}
        fullWidth
        style={styles.save}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: 20 },
  field: { marginBottom: 16 },
  save: { marginTop: 8 },
});
