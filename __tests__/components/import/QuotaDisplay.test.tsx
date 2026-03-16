import React from 'react';
import { render } from '@testing-library/react-native';
import type { PlanStatus } from '../../../src/types';

const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();

jest.mock('../../../src/hooks', () => ({
  usePlanStatus: () => mockUsePlanStatus(),
}));

import { QuotaDisplay } from '../../../src/components/import/QuotaDisplay';

describe('QuotaDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when planStatus is null', () => {
    mockUsePlanStatus.mockReturnValue(null);

    const { queryByTestId } = render(<QuotaDisplay />);
    expect(queryByTestId('quota-display')).toBeNull();
  });

  it('renders nothing for premium tier', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'premium',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: Infinity,
      geminiQuotaRemaining: Infinity,
      storeSubscription: null,
    });

    const { queryByTestId } = render(<QuotaDisplay />);
    expect(queryByTestId('quota-display')).toBeNull();
  });

  it('shows label for free tier with quota exhausted', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 3,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const { getByTestId, getByText } = render(<QuotaDisplay />);
    expect(getByTestId('quota-vps-text')).toBeTruthy();
    expect(getByText('Import premium')).toBeTruthy();
    expect(getByText(/2\/2 utilises/)).toBeTruthy();
  });

  it('shows usage for trial tier with 1 remaining', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 8,
      geminiQuotaRemaining: 1,
      storeSubscription: null,
    });

    const { getByText } = render(<QuotaDisplay />);
    expect(getByText(/1\/2 utilises/)).toBeTruthy();
  });

  it('shows 0/2 when both premium imports available', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 2,
      storeSubscription: null,
    });

    const { getByText } = render(<QuotaDisplay />);
    expect(getByText(/0\/2 utilises/)).toBeTruthy();
  });

  it('shows 2/2 when all premium imports used', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 7,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const { getByText } = render(<QuotaDisplay />);
    expect(getByText(/2\/2 utilises/)).toBeTruthy();
  });

  it('shows progress bar', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 5,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const { getByTestId } = render(<QuotaDisplay />);
    expect(getByTestId('quota-progress-bar')).toBeTruthy();
  });

  it('shows 2/2 when quota exhausted', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 0,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const { getByText } = render(<QuotaDisplay />);
    expect(getByText(/2\/2 utilises/)).toBeTruthy();
  });
});
