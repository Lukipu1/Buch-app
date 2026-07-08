import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { BookDetailScreen } from '@/features/library/BookDetailScreen';

export default function BookDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookDetailScreen bookId={id} />;
}
