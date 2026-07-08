import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ReaderScreen } from '@/features/reader/ReaderScreen';

export default function ReaderRoute() {
  const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
  const initialPage = page ? Number(page) : undefined;
  return (
    <ReaderScreen
      bookId={id}
      initialPage={Number.isFinite(initialPage) ? initialPage : undefined}
    />
  );
}
