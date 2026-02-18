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
    });

    const { queryByTestId } = render(<QuotaDisplay />);
    expect(queryByTestId('quota-display')).toBeNull();
  });

  it('shows VPS usage for free tier', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 3,
      geminiQuotaRemaining: 0,
    });

    const { getByTestId, queryByTestId } = render(<QuotaDisplay />);

    const children = getByTestId('quota-vps-text').props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('7/10');
    expect(queryByTestId('quota-gemini-text')).toBeNull();
  });

  it('shows VPS and Gemini usage for trial tier', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 8,
      geminiQuotaRemaining: 1,
    });

    const { getByTestId } = render(<QuotaDisplay />);

    const children = getByTestId('quota-vps-text').props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('2/10');
    expect(getByTestId('quota-gemini-text')).toBeTruthy();
  });

  it('shows green Gemini text when available', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 1,
    });

    const { getByTestId } = render(<QuotaDisplay />);
    const geminiText = getByTestId('quota-gemini-text');
    expect(geminiText.props.children).toEqual(
      expect.arrayContaining([expect.stringContaining('disponible')])
    );
  });

  it('shows orange Gemini text when used', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 7,
      geminiQuotaRemaining: 0,
    });

    const { getByTestId } = render(<QuotaDisplay />);
    const geminiText = getByTestId('quota-gemini-text');
    expect(geminiText.props.children).toEqual(
      expect.arrayContaining([expect.stringContaining('utilise')])
    );
  });

  it('shows progress bar', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 5,
      geminiQuotaRemaining: 0,
    });

    const { getByTestId } = render(<QuotaDisplay />);
    expect(getByTestId('quota-progress-bar')).toBeTruthy();
  });

  it('shows 10/10 when quota exhausted', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 0,
      geminiQuotaRemaining: 0,
    });

    const { getByTestId } = render(<QuotaDisplay />);
    const children = getByTestId('quota-vps-text').props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('10/10');
  });
});
