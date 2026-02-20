import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrialExpiryModal } from '../../../src/components/import/TrialExpiryModal';
import type { UserPlan } from '../../../src/types';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const expiredPlan: UserPlan = {
  id: 'test-plan',
  tier: 'free',
  trialStartDate: '2026-01-01T00:00:00.000Z',
  trialEndsDate: '2026-01-08T00:00:00.000Z',
  premiumActivatedDate: null,
  promoCode: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-08T00:00:00.000Z',
};

let mockUserPlanData: UserPlan | undefined = expiredPlan;

jest.mock('../../../src/hooks', () => ({
  useUserPlan: () => ({ data: mockUserPlanData }),
}));

describe('TrialExpiryModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserPlanData = expiredPlan;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('shows modal when trial expired and prompt not yet shown', async () => {
    const { findByText } = render(React.createElement(TrialExpiryModal));

    const title = await findByText('Votre essai Premium est termine');
    expect(title).toBeDefined();
  });

  it('does not show upgrade button when prompt was already shown', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

    const { queryByTestId } = render(React.createElement(TrialExpiryModal));

    // Wait for async effect to settle
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('trial_expiry_prompt_shown');
    });

    expect(queryByTestId('trial-expiry-upgrade')).toBeNull();
  });

  it('does not show modal when user never had a trial', async () => {
    mockUserPlanData = { ...expiredPlan, trialStartDate: null };

    const { queryByTestId } = render(React.createElement(TrialExpiryModal));

    // Give effect time to run
    await waitFor(() => {
      expect(queryByTestId('trial-expiry-upgrade')).toBeNull();
    });
  });

  it('does not show modal when user is still on trial', async () => {
    mockUserPlanData = { ...expiredPlan, tier: 'trial' };

    const { queryByTestId } = render(React.createElement(TrialExpiryModal));

    await waitFor(() => {
      expect(queryByTestId('trial-expiry-upgrade')).toBeNull();
    });
  });

  it('dismisses and sets AsyncStorage flag on "Plus tard"', async () => {
    const { findByTestId, queryByTestId } = render(React.createElement(TrialExpiryModal));

    const dismissBtn = await findByTestId('trial-expiry-dismiss');
    fireEvent.press(dismissBtn);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('trial_expiry_prompt_shown', 'true');
    await waitFor(() => {
      expect(queryByTestId('trial-expiry-upgrade')).toBeNull();
    });
  });

  it('navigates to upgrade and sets flag on "Passer a Premium"', async () => {
    const { router } = jest.requireMock('expo-router');
    const { findByTestId } = render(React.createElement(TrialExpiryModal));

    const upgradeBtn = await findByTestId('trial-expiry-upgrade');
    fireEvent.press(upgradeBtn);

    expect(router.push).toHaveBeenCalledWith('/upgrade');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('trial_expiry_prompt_shown', 'true');
  });
});
