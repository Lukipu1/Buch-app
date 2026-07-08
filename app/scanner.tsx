import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ScannerScreen } from '@/features/scanner/ScannerScreen';

export default function ScannerRoute() {
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  return <ScannerScreen targetBookId={bookId} />;
}
