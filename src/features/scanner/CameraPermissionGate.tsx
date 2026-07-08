import React from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components';
import { useTheme } from '@/theme';

interface CameraPermissionGateProps {
  onRequest: () => void;
  denied: boolean;
}

/** Shown when the camera permission is missing or was denied. */
export function CameraPermissionGate({
  onRequest,
  denied,
}: CameraPermissionGateProps) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <EmptyState
        icon="camera-outline"
        title="Kamerazugriff benötigt"
        message={
          denied
            ? 'Erlaube den Kamerazugriff in den Einstellungen, um Seiten zu scannen. Alternativ kannst du Bilder aus der Galerie importieren.'
            : 'Buch benötigt Zugriff auf die Kamera, um Seiten deiner Bücher zu scannen.'
        }
        actionLabel={denied ? undefined : 'Zugriff erlauben'}
        onAction={denied ? undefined : onRequest}
      />
    </View>
  );
}
