import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, Text } from '@/components';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';

import { ONBOARDING_SLIDES } from './onboardingData';

export function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [index, setIndex] = useState(0);
  const isLast = index === ONBOARDING_SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const finish = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const next = () => {
    if (isLast) {
      void finish();
    } else {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.skip, { top: insets.top + 8 }]}>
        {!isLast && (
          <Text variant="callout" color="accent" onPress={finish}>
            Überspringen
          </Text>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.flex}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.colors.accentMuted,
                  borderRadius: theme.radius.xxl,
                },
              ]}
            >
              <Ionicons name={slide.icon} size={64} color={theme.colors.accent} />
            </View>
            <Text variant="title1" center style={styles.title}>
              {slide.title}
            </Text>
            <Text
              variant="body"
              color="textSecondary"
              center
              style={styles.description}
            >
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === index ? 22 : 8,
                  backgroundColor:
                    i === index ? theme.colors.accent : theme.colors.separator,
                },
              ]}
            />
          ))}
        </View>
        <Button
          label={isLast ? 'Loslegen' : 'Weiter'}
          onPress={next}
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skip: { position: 'absolute', right: 20, zIndex: 2 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: { marginBottom: 16 },
  description: { maxWidth: 320, lineHeight: 24 },
  footer: { paddingHorizontal: 24, gap: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
});
