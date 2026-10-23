import React, { memo } from 'react';
import {
  GestureResponderEvent,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';

interface PageFrame {
  width: number;
  height: number;
  paddingTop: number;
  paddingBottom: number;
  paddingHorizontal: number;
}

interface TextPageViewProps {
  text: string;
  textStyle: TextStyle;
  frame: PageFrame;
  onTap: (x: number) => void;
}

/** One paginated screen of reflowed text. */
export const TextPageView = memo(function TextPageView({
  text,
  textStyle,
  frame,
  onTap,
}: TextPageViewProps) {
  return (
    <Pressable
      onPress={(e: GestureResponderEvent) => onTap(e.nativeEvent.pageX)}
      style={{ width: frame.width, height: frame.height }}
      accessible={false}
    >
      <View
        style={[
          styles.textFrame,
          {
            paddingTop: frame.paddingTop,
            paddingHorizontal: frame.paddingHorizontal,
            height: frame.height - frame.paddingBottom,
          },
        ]}
      >
        <Text style={textStyle} allowFontScaling={false} accessibilityRole="text">
          {text}
        </Text>
      </View>
    </Pressable>
  );
});

interface ImagePageViewProps {
  imageUri: string;
  frame: PageFrame;
  onTap: (x: number) => void;
}

/** The original scan, pinch-to-zoom on iOS. */
export const ImagePageView = memo(function ImagePageView({
  imageUri,
  frame,
  onTap,
}: ImagePageViewProps) {
  const content = (
    <Pressable
      onPress={(e: GestureResponderEvent) => onTap(e.nativeEvent.pageX)}
      style={{
        width: frame.width,
        height: frame.height,
        paddingTop: frame.paddingTop,
        paddingBottom: frame.paddingBottom,
        paddingHorizontal: 10,
      }}
      accessible={false}
    >
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
    </Pressable>
  );

  if (Platform.OS !== 'ios') return content;

  return (
    <ScrollView
      style={{ width: frame.width, height: frame.height }}
      maximumZoomScale={4}
      minimumZoomScale={1}
      bouncesZoom
      centerContent
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
});

export type { PageFrame };

const styles = StyleSheet.create({
  textFrame: { overflow: 'hidden' },
  image: { flex: 1, width: '100%' },
});
