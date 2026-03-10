import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPlan } from '../../../src/types';

const mockUserPlan = jest.fn<{ data: UserPlan | undefined }, []>();

jest.mock('../../../src/hooks', () => ({
  useUserPlan: () => mockUserPlan(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

import { SubscriptionExpiryModal } from '../../../src/components/import/SubscriptionExpiryModal';
import { router } from 'expo-router';

const basePlan: UserPlan = {
  id: '1',
  tier: 'free',
  trialStartDate: null,
  trialEndsDate: null,
  premiumActivatedDate: null,
  promoCode: null,
  premiumSource: null,
  subscriptionStatus: null,
  expiresAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('SubscriptionExpiryModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('shows modal when store subscription expired', async () => {
    const expiredPlan: UserPlan = {
      ...basePlan,
      tier: 'free',
      premiumSource: 'store',
      subscriptionStatus: 'expired',
      premiumActivatedDate: '2026-02-01T00:00:00.000Z',
    };
    mockUserPlan.mockReturnValue({ data: expiredPlan });

    const { findByTestId } = render(React.createElement(SubscriptionExpiryModal));

    // When visible, the title text should be rendered
    const title = await findByTestId('subscription-expiry-title');
    expect(title).toBeTruthy();
  });

  it('does not show modal for free user without store history', () => {
    mockUserPlan.mockReturnValue({ data: basePlan });

    const { queryByTestId } = render(React.createElement(SubscriptionExpiryModal));

    // Title should not be present when visible=false (Modal hides children)
    expect(queryByTestId('subscription-expiry-title')).toBeNull();
  });

  it('does not show modal for active premium user', () => {
    const activePlan: UserPlan = {
      ...basePlan,
      tier: 'premium',
      premiumSource: 'store',
      subscriptionStatus: 'active',
    };
    mockUserPlan.mockReturnValue({ data: activePlan });

    const { queryByTestId } = render(React.createElement(SubscriptionExpiryModal));

    expect(queryByTestId('subscription-expiry-title')).toBeNull();
  });

  it('does not show modal if already shown', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const expiredPlan: UserPlan = {
      ...basePlan,
      tier: 'free',
      premiumSource: 'store',
      subscriptionStatus: 'expired',
      premiumActivatedDate: '2026-02-01T00:00:00.000Z',
    };
    mockUserPlan.mockReturnValue({ data: expiredPlan });

    const { queryByTestId } = render(React.createElement(SubscriptionExpiryModal));

    // Wait for async effect
    await new Promise((r) => setTimeout(r, 50));

    expect(queryByTestId('subscription-expiry-title')).toBeNull();
  });

  it('navigates to upgrade when resubscribe pressed', async () => {
    const expiredPlan: UserPlan = {
      ...basePlan,
      tier: 'free',
      premiumSource: 'store',
      subscriptionStatus: 'expired',
      premiumActivatedDate: '2026-02-01T00:00:00.000Z',
    };
    mockUserPlan.mockReturnValue({ data: expiredPlan });

    const { findByTestId } = render(React.createElement(SubscriptionExpiryModal));

    const button = await findByTestId('subscription-expiry-resubscribe');
    fireEvent.press(button);

    expect(router.push).toHaveBeenCalledWith('/upgrade');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('subscription_expiry_prompt_shown', 'true');
  });

  it('dismisses and saves flag when Plus tard pressed', async () => {
    const expiredPlan: UserPlan = {
      ...basePlan,
      tier: 'free',
      premiumSource: 'store',
      subscriptionStatus: 'expired',
      premiumActivatedDate: '2026-02-01T00:00:00.000Z',
    };
    mockUserPlan.mockReturnValue({ data: expiredPlan });

    const { findByTestId } = render(React.createElement(SubscriptionExpiryModal));

    const button = await findByTestId('subscription-expiry-dismiss');
    fireEvent.press(button);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('subscription_expiry_prompt_shown', 'true');
  });
});
