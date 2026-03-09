import React from 'react';
import { render } from '@testing-library/react-native';
import type { PlanStatus } from '../../../src/types';

const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();

jest.mock('../../../src/hooks', () => ({
  usePlanStatus: () => mockUsePlanStatus(),
}));

import { TrialStatusBadge } from '../../../src/components/import/TrialStatusBadge';

describe('TrialStatusBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when planStatus is null', () => {
    mockUsePlanStatus.mockReturnValue(null);

    const { queryByTestId } = render(<TrialStatusBadge />);
    expect(queryByTestId('trial-status-badge')).toBeNull();
  });

  it('renders nothing for free tier', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const { queryByTestId } = render(<TrialStatusBadge />);
    expect(queryByTestId('trial-status-badge')).toBeNull();
  });

  it('renders nothing for premium tier', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'premium',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 100,
      geminiQuotaRemaining: 100,
      storeSubscription: null,
    });

    const { queryByTestId } = render(<TrialStatusBadge />);
    expect(queryByTestId('trial-status-badge')).toBeNull();
  });

  it('shows correct days remaining with Gemini quota available', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 1,
      storeSubscription: null,
    });

    const { getByTestId } = render(<TrialStatusBadge />);

    expect(getByTestId('trial-days-text').props.children).toBe('Essai : 5 jours restants');
    expect(getByTestId('trial-quota-text').props.children).toEqual(
      expect.arrayContaining([expect.stringContaining('1 import premium aujourd')])
    );
  });

  it('shows singular day text for 1 day remaining', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 1,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 1,
      storeSubscription: null,
    });

    const { getByTestId } = render(<TrialStatusBadge />);
    expect(getByTestId('trial-days-text').props.children).toBe('Essai : 1 jour restant');
  });

  it('shows orange quota text when Gemini used today', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 3,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 8,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const { getByTestId } = render(<TrialStatusBadge />);

    expect(getByTestId('trial-quota-text').props.children).toEqual(
      expect.arrayContaining([expect.stringContaining('import premium utilise')])
    );
  });
});
