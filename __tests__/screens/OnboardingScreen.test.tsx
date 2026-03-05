import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const mockTrack = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/services/analytics', () => ({
  analytics: { track: (...args: unknown[]) => mockTrack(...args) },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: {} },
}));

jest.mock('../../src/components/onboarding/OnboardingCarousel', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, Pressable } = require('react-native');
  return {
    OnboardingCarousel: ({
      onComplete,
      onSkip,
    }: {
      onComplete: () => void;
      onSkip: (index: number) => void;
    }) => (
      <View testID="onboarding-carousel">
        <Pressable testID="mock-skip" onPress={() => onSkip(1)}>
          <Text>Skip</Text>
        </Pressable>
        <Pressable testID="mock-complete" onPress={onComplete}>
          <Text>Complete</Text>
        </Pressable>
      </View>
    ),
  };
});

import OnboardingScreen, { shouldShowOnboarding } from '../../app/onboarding';

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the onboarding screen', () => {
    const { getByTestId } = render(<OnboardingScreen />);
    expect(getByTestId('onboarding-screen')).toBeTruthy();
    expect(getByTestId('onboarding-carousel')).toBeTruthy();
  });

  it('tracks ONBOARDING_STARTED on mount', () => {
    render(<OnboardingScreen />);
    expect(mockTrack).toHaveBeenCalledWith('Onboarding Started');
  });

  it('sets AsyncStorage flag and navigates to home on complete', async () => {
    const { getByTestId } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('mock-complete'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasCompletedOnboarding', 'true');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('tracks ONBOARDING_COMPLETED on complete', async () => {
    const { getByTestId } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('mock-complete'));

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('Onboarding Completed');
    });
  });

  it('sets AsyncStorage flag and navigates to home on skip', async () => {
    const { getByTestId } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('mock-skip'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasCompletedOnboarding', 'true');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('tracks ONBOARDING_SKIPPED with skipPoint on skip', async () => {
    const { getByTestId } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('mock-skip'));

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('Onboarding Skipped', { skipPoint: 1 });
    });
  });

  it('navigates back instead of replace when from=settings', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({
      from: 'settings',
    });

    const { getByTestId } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('mock-complete'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasCompletedOnboarding', 'true');
      expect(router.back).toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});

describe('shouldShowOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when hasCompletedOnboarding is not set', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await shouldShowOnboarding();
    expect(result).toBe(true);
  });

  it('returns false when hasCompletedOnboarding is true', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const result = await shouldShowOnboarding();
    expect(result).toBe(false);
  });

  it('returns true when AsyncStorage throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await shouldShowOnboarding();
    expect(result).toBe(true);
  });
});
