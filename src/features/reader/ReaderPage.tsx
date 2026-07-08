import React from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '@/components';
import { Page } from '@/types/models';

import { ReaderColors } from './readerTheme';

interface ReaderPageProps {
  page: Page;
  mode: 'image' | 'text';
  fontSize: number;
  colors: ReaderColors;
}

/** Renders a single page either as its scanned image or its OCR text. */
export function ReaderPage({ page, mode, fontSize, colors }: ReaderPageProps) {
  const { width } = useWindowDimensions();

  if (mode === 'image') {
    return (
      <View style={[styles.imageWrap, { width }]}>
        <Image
          source={{ uri: page.imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.textContent}
      showsVerticalScrollIndicator={false}
    >
      {page.ocrText ? (
        <Text
          style={[
            styles.text,
            { fontSize, lineHeight: fontSize * 1.6, color: colors.text },
          ]}
        >
          {page.ocrText}
        </Text>
      ) : (
        <Text style={[styles.placeholder, { color: colors.muted }]}>
          Für diese Seite liegt noch kein erkannter Text vor.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  textContent: { paddingHorizontal: 28, paddingVertical: 40 },
  text: { fontWeight: '400' },
  placeholder: { fontSize: 16, textAlign: 'center', marginTop: 40 },
});
