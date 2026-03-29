import React from 'react';
import { render } from '@testing-library/react-native';
import type { PlanStatus } from '../../src/types';

const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();
const mockUseUserPlan = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn(),
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

import MenuScreen from '../../app/(tabs)/menu';

describe('MenuScreen - Plan & Usage section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPlan.mockReturnValue({ data: null });
  });

  it('shows free tier info', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 7,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const { getByTestId } = render(<MenuScreen />);

    const badge = getByTestId('plan-tier-badge');
    expect(badge).toBeTruthy();
    const badgeChildren = badge.props.children;
    const badgeEl = React.isValidElement(badgeChildren) ? badgeChildren : null;
    const badgeText = badgeEl ? (badgeEl.props as { children: string }).children : '';
    expect(badgeText).toContain('Standard');

    const usageChildren = getByTestId('plan-vps-usage').props.children;
    const usageText = Array.isArray(usageChildren) ? usageChildren.join('') : usageChildren;
    expect(usageText).toContain('5/5');
    expect(usageText).toContain('Premium import');
  });

  it('shows trial tier with Gemini info', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 1,
      storeSubscription: null,
    });

    const { getByTestId } = render(<MenuScreen />);

    const badge = getByTestId('plan-tier-badge');
    const badgeChildren = badge.props.children;
    const badgeEl = React.isValidElement(badgeChildren) ? badgeChildren : null;
    const badgeText = badgeEl ? (badgeEl.props as { children: string }).children : '';
    expect(badgeText).toContain('Standard');
  });

  it('shows premium tier with active status', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'premium',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: Infinity,
      geminiQuotaRemaining: Infinity,
      storeSubscription: null,
    });

    const { getByTestId, queryByTestId } = render(<MenuScreen />);

    const badge = getByTestId('plan-tier-badge');
    const badgeChildren = badge.props.children;
    const badgeEl = React.isValidElement(badgeChildren) ? badgeChildren : null;
    const badgeText = badgeEl ? (badgeEl.props as { children: string }).children : '';
    expect(badgeText).toContain('Premium');

    expect(getByTestId('plan-premium-active')).toBeTruthy();
    expect(queryByTestId('plan-vps-usage')).toBeNull();
    expect(queryByTestId('plan-upgrade-button')).toBeNull();
  });

  it('shows upgrade button for non-premium', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const { getByTestId } = render(<MenuScreen />);
    expect(getByTestId('plan-upgrade-button')).toBeTruthy();
  });

  it('does not render section when planStatus is null', () => {
    mockUsePlanStatus.mockReturnValue(null);

    const { queryByTestId } = render(<MenuScreen />);
    expect(queryByTestId('plan-usage-section')).toBeNull();
  });

  describe('store subscription states', () => {
    it('shows active store subscription with renewal date', () => {
      mockUsePlanStatus.mockReturnValue({
        tier: 'premium',
        trialDaysRemaining: null,
        isTrialExpired: false,
        canUsePremium: true,
        vpsQuotaRemaining: Infinity,
        geminiQuotaRemaining: Infinity,
        storeSubscription: {
          isActive: true,
          willRenew: true,
          expirationDate: '2026-04-10T00:00:00Z',
          store: 'app_store',
          productIdentifier: 'mmmh_premium_monthly',
          subscriptionStatus: 'active',
        },
      });

      const { getByTestId, getByText } = render(<MenuScreen />);

      expect(getByTestId('plan-premium-active')).toBeTruthy();
      expect(getByTestId('plan-renewal-date')).toBeTruthy();
      expect(getByText(/Renouvellement le/)).toBeTruthy();
      expect(getByTestId('plan-manage-subscription')).toBeTruthy();
    });

    it('shows cancelled subscription with expiry date and resubscribe', () => {
      mockUsePlanStatus.mockReturnValue({
        tier: 'premium',
        trialDaysRemaining: null,
        isTrialExpired: false,
        canUsePremium: true,
        vpsQuotaRemaining: Infinity,
        geminiQuotaRemaining: Infinity,
        storeSubscription: {
          isActive: true,
          willRenew: false,
          expirationDate: '2026-04-10T00:00:00Z',
          store: 'app_store',
          productIdentifier: 'mmmh_premium_monthly',
          subscriptionStatus: 'cancelled',
        },
      });

      const { getByTestId, getByText } = render(<MenuScreen />);

      expect(getByTestId('plan-premium-cancelled')).toBeTruthy();
      expect(getByTestId('plan-expiry-date')).toBeTruthy();
      expect(getByText(/Expire le/)).toBeTruthy();
      expect(getByTestId('plan-resubscribe-button')).toBeTruthy();
    });

    it('shows billing issue warning for grace period', () => {
      mockUsePlanStatus.mockReturnValue({
        tier: 'premium',
        trialDaysRemaining: null,
        isTrialExpired: false,
        canUsePremium: true,
        vpsQuotaRemaining: Infinity,
        geminiQuotaRemaining: Infinity,
        storeSubscription: {
          isActive: true,
          willRenew: true,
          expirationDate: '2026-04-10T00:00:00Z',
          store: 'app_store',
          productIdentifier: 'mmmh_premium_monthly',
          subscriptionStatus: 'grace_period',
        },
      });

      const { getByTestId, getByText } = render(<MenuScreen />);

      expect(getByTestId('plan-premium-grace')).toBeTruthy();
      expect(getByText(/Problème de paiement/)).toBeTruthy();
    });

    it('shows promo code info for promo premium (no store sub)', () => {
      mockUsePlanStatus.mockReturnValue({
        tier: 'premium',
        trialDaysRemaining: null,
        isTrialExpired: false,
        canUsePremium: true,
        vpsQuotaRemaining: Infinity,
        geminiQuotaRemaining: Infinity,
        storeSubscription: null,
      });
      mockUseUserPlan.mockReturnValue({
        data: {
          id: '1',
          tier: 'premium',
          trialStartDate: null,
          trialEndsDate: null,
          premiumActivatedDate: '2026-02-01T00:00:00Z',
          promoCode: 'MMMH-BETA',
          premiumSource: 'promo',
          subscriptionStatus: null,
          expiresAt: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      });

      const { getByTestId, getByText } = render(<MenuScreen />);

      expect(getByTestId('plan-premium-active')).toBeTruthy();
      expect(getByTestId('plan-promo-code')).toBeTruthy();
      expect(getByText(/Code : MMMH-BETA/)).toBeTruthy();
    });
  });
});
