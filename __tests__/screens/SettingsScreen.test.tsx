import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Share, Linking } from 'react-native';
import type { PlanStatus } from '../../src/types';

const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();
const mockUseUserPlan = jest.fn();
const mockTrack = jest.fn();
const mockReset = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('../../src/services/planSync', () => ({
  initDeviceId: jest.fn(),
  getDeviceId: () => 'test-device-id-abc',
}));

jest.mock('../../src/services/database', () => ({
  getDatabase: () => ({ runSync: jest.fn() }),
}));

jest.mock('../../src/hooks', () => ({
  usePlanStatus: () => mockUsePlanStatus(),
  useUserPlan: () => mockUseUserPlan(),
}));

jest.mock('../../src/services/analytics', () => ({
  analytics: {
    track: (...args: unknown[]) => mockTrack(...args),
    reset: () => mockReset(),
  },
}));

// Alert, Share, Linking are already jest.fn() from __mocks__/react-native.js

import MenuScreen from '../../app/(tabs)/menu';

function renderScreen() {
  return render(<MenuScreen />);
}

function setFreePlan() {
  mockUsePlanStatus.mockReturnValue({
    tier: 'free',
    trialDaysRemaining: null,
    isTrialExpired: false,
    canUsePremium: false,
    vpsQuotaRemaining: 7,
    geminiQuotaRemaining: 0,
    storeSubscription: null,
  });
  mockUseUserPlan.mockReturnValue({ data: null });
}

function setTrialPlan() {
  mockUsePlanStatus.mockReturnValue({
    tier: 'trial',
    trialDaysRemaining: 5,
    isTrialExpired: false,
    canUsePremium: true,
    vpsQuotaRemaining: 10,
    geminiQuotaRemaining: 1,
    storeSubscription: null,
  });
  mockUseUserPlan.mockReturnValue({ data: { trialStartDate: '2026-01-01' } });
}

function setPremiumPlan() {
  mockUsePlanStatus.mockReturnValue({
    tier: 'premium',
    trialDaysRemaining: null,
    isTrialExpired: false,
    canUsePremium: true,
    vpsQuotaRemaining: Infinity,
    geminiQuotaRemaining: Infinity,
    storeSubscription: null,
  });
  mockUseUserPlan.mockReturnValue({ data: null });
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setFreePlan();
  });

  // --- Task 9.2: All sections render ---
  describe('Section rendering', () => {
    it('renders all sections', () => {
      const { getByTestId } = renderScreen();

      expect(getByTestId('plan-usage-section')).toBeTruthy();
      expect(getByTestId('preferences-section')).toBeTruthy();
      expect(getByTestId('help-section')).toBeTruthy();
      expect(getByTestId('about-section')).toBeTruthy();
      expect(getByTestId('danger-zone-section')).toBeTruthy();
    });

    it('renders developer section in __DEV__', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('dev-section')).toBeTruthy();
    });
  });

  // --- Task 9.3: Plan status displays correct tier ---
  describe('Plan status display', () => {
    it('shows free tier info', () => {
      setFreePlan();
      const { getByTestId } = renderScreen();

      const badge = getByTestId('plan-tier-badge');
      const badgeChildren = badge.props.children;
      const badgeEl = React.isValidElement(badgeChildren) ? badgeChildren : null;
      const badgeText = badgeEl ? (badgeEl.props as { children: string }).children : '';
      expect(badgeText).toContain('Standard');
    });

    it('shows trial tier with days remaining', () => {
      setTrialPlan();
      const { getByTestId } = renderScreen();

      const badge = getByTestId('plan-tier-badge');
      const badgeChildren = badge.props.children;
      const badgeEl = React.isValidElement(badgeChildren) ? badgeChildren : null;
      const badgeText = badgeEl ? (badgeEl.props as { children: string }).children : '';
      expect(badgeText).toContain('Essai');
      expect(getByTestId('plan-gemini-usage')).toBeTruthy();
    });

    it('shows premium tier with active status', () => {
      setPremiumPlan();
      const { getByTestId, queryByTestId } = renderScreen();

      const badge = getByTestId('plan-tier-badge');
      const badgeChildren = badge.props.children;
      const badgeEl = React.isValidElement(badgeChildren) ? badgeChildren : null;
      const badgeText = badgeEl ? (badgeEl.props as { children: string }).children : '';
      expect(badgeText).toContain('Premium');
      expect(getByTestId('plan-premium-active')).toBeTruthy();
      expect(queryByTestId('plan-vps-usage')).toBeNull();
      expect(queryByTestId('plan-upgrade-button')).toBeNull();
    });

    it('does not render plan section when planStatus is null', () => {
      mockUsePlanStatus.mockReturnValue(null);
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('plan-usage-section')).toBeNull();
    });

    it('shows upgrade button for non-premium', () => {
      setFreePlan();
      const { getByTestId } = renderScreen();
      expect(getByTestId('plan-upgrade-button')).toBeTruthy();
    });
  });

  // --- Task 9.4: Theme toggle (disabled, dark mode coming soon) ---
  describe('Theme toggle', () => {
    it('displays theme toggle row', () => {
      const { getByTestId } = renderScreen();
      const row = getByTestId('theme-toggle');
      expect(row).toBeTruthy();
    });
  });

  // --- Task 9.5: Clear All Data requires double confirmation ---
  describe('Clear All Data', () => {
    it('shows first confirmation alert on press', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('clear-all-data'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Effacer toutes les données',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('shows second confirmation after first is accepted', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('clear-all-data'));

      // Get the first alert's destructive button and press it
      const firstAlertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      const continueButton = firstAlertButtons.find(
        (b: { text: string }) => b.text === 'Continuer'
      );
      continueButton.onPress();

      // Second alert should fire
      expect(Alert.alert).toHaveBeenCalledTimes(2);
      expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe('Confirmation finale');
    });

    it('tracks CLEAR_DATA_INITIATED on first press', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('clear-all-data'));

      expect(mockTrack).toHaveBeenCalledWith('Clear Data Initiated');
    });

    it('tracks CLEAR_DATA_CONFIRMED after double confirm', async () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('clear-all-data'));

      const firstAlertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      const continueButton = firstAlertButtons.find(
        (b: { text: string }) => b.text === 'Continuer'
      );
      continueButton.onPress();

      const secondAlertButtons = (Alert.alert as jest.Mock).mock.calls[1][2];
      const confirmButton = secondAlertButtons.find(
        (b: { text: string }) => b.text === 'Tout effacer'
      );
      await confirmButton.onPress();

      expect(mockTrack).toHaveBeenCalledWith('Clear Data Confirmed');
    });
  });

  // --- Task 9.6: Share App triggers Share API ---
  describe('Share App', () => {
    it('triggers Share API on press', async () => {
      const { getByTestId } = renderScreen();
      await waitFor(() => fireEvent.press(getByTestId('share-app')));

      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining('mymealmatehelper.com/download'),
      });
    });

    it('tracks SHARE_APP_TAPPED', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('share-app'));

      expect(mockTrack).toHaveBeenCalledWith('Share App Tapped');
    });
  });

  // --- Task 9.7: External links open via expo-web-browser ---
  describe('External links', () => {
    it('Privacy Policy opens URL', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('about-privacy'));

      expect(Linking.openURL).toHaveBeenCalledWith('https://mymealmatehelper.com/privacy');
    });

    it('Terms opens URL', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('about-terms'));

      expect(Linking.openURL).toHaveBeenCalledWith('https://mymealmatehelper.com/terms');
    });

    it('Contact Support opens email composer', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('help-support'));

      expect(Linking.openURL).toHaveBeenCalledWith(
        'mailto:support@mymealmatehelper.com?subject=Support mmmh'
      );
    });
  });

  // --- Task 9.8: Analytics events tracked ---
  describe('Analytics tracking', () => {
    it('tracks SETTINGS_VIEWED on mount', () => {
      renderScreen();
      expect(mockTrack).toHaveBeenCalledWith('Settings Viewed');
    });

    it('tracks HELP_RESOURCE_ACCESSED for tutorial', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('help-tutorial'));

      expect(mockTrack).toHaveBeenCalledWith('Help Resource Accessed', { resource: 'tutorial' });
    });

    it('tracks HELP_RESOURCE_ACCESSED for feedback', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('help-feedback'));

      expect(mockTrack).toHaveBeenCalledWith('Help Resource Accessed', { resource: 'feedback' });
    });

    it('tracks HELP_RESOURCE_ACCESSED for support', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('help-support'));

      expect(mockTrack).toHaveBeenCalledWith('Help Resource Accessed', { resource: 'support' });
    });
  });

  // --- About section ---
  describe('About section', () => {
    it('shows version info', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('about-version')).toBeTruthy();
    });

    it('shows credits', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('credits')).toBeTruthy();
    });
  });

  // --- Units placeholder ---
  describe('Preferences section', () => {
    it('units row is disabled', () => {
      const { getByTestId } = renderScreen();
      const unitsRow = getByTestId('units-row');
      expect(unitsRow).toBeTruthy();
    });
  });
});
