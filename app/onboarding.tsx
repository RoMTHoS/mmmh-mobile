import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { OnboardingCarousel } from '../src/components/onboarding/OnboardingCarousel';
import { analytics } from '../src/services/analytics';
import { EVENTS } from '../src/utils/analyticsEvents';
import { colors } from '../src/theme';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ from?: string }>();
  const isFromSettings = params.from === 'settings';

  useEffect(() => {
    analytics.track(EVENTS.ONBOARDING_STARTED);
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    if (isFromSettings) {
      router.back();
    } else {
      router.replace('/upgrade?from=onboarding');
    }
  };

  const handleComplete = async () => {
    analytics.track(EVENTS.ONBOARDING_COMPLETED);
    await completeOnboarding();
  };

  const handleSkip = async (slideIndex: number) => {
    analytics.track(EVENTS.ONBOARDING_SKIPPED, { skipPoint: slideIndex });
    await completeOnboarding();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="onboarding-screen">
      <OnboardingCarousel onComplete={handleComplete} onSkip={handleSkip} />
    </View>
  );
}

export async function shouldShowOnboarding(): Promise<boolean> {
  // Dev skip flag
  const devSkip = Constants.expoConfig?.extra?.devSkipOnboarding;
  if (devSkip === true || devSkip === 'true') {
    return false;
  }

  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    return completed !== 'true';
  } catch {
    return true;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
