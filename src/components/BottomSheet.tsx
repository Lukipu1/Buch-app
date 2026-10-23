import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Disables closing via backdrop tap (e.g. while saving). */
  locked?: boolean;
  /** Overrides the sheet surface colour (reader themes). */
  backgroundColor?: string;
  grabberColor?: string;
  style?: ViewStyle;
}

/** Modal bottom sheet with backdrop, grabber and keyboard handling. */
export function BottomSheet({
  onClose,
  children,
  locked,
  backgroundColor,
  grabberColor,
  style,
}: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      animationType="slide"
      onRequestClose={locked ? () => {} : onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={locked ? undefined : onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: backgroundColor ?? theme.colors.backgroundElevated,
              borderTopLeftRadius: theme.radius.xxl,
              borderTopRightRadius: theme.radius.xxl,
              paddingBottom: insets.bottom + 20,
            },
            style,
          ]}
        >
          <View
            style={[
              styles.grabber,
              { backgroundColor: grabberColor ?? theme.colors.separator },
            ]}
          />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 10 },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
});
