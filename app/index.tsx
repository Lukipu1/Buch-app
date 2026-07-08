import { Redirect } from 'expo-router';
import React from 'react';

import { useAppStore } from '@/store/useAppStore';

/** Entry route: sends the user to onboarding or straight into the library. */
export default function Index() {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  return <Redirect href={onboardingComplete ? '/library' : '/onboarding'} />;
}
