import React from 'react';
import { render } from '@testing-library/react-native';
import type { PlanStatus } from '../../src/types';

const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();

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
}));

import MenuScreen from '../../app/(tabs)/menu';

describe('MenuScreen - Plan & Usage section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows free tier info', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 7,
      geminiQuotaRemaining: 0,
    });

    const { getByTestId } = render(<MenuScreen />);

    expect(getByTestId('plan-tier-label')).toBeTruthy();
    const tierChildren = getByTestId('plan-tier-label').props.children;
    const tierText = Array.isArray(tierChildren) ? tierChildren.join('') : tierChildren;
    expect(tierText).toContain('Gratuit');

    const usageChildren = getByTestId('plan-vps-usage').props.children;
    const usageText = Array.isArray(usageChildren) ? usageChildren.join('') : usageChildren;
    expect(usageText).toContain('3/10');
  });

  it('shows trial tier with Gemini info', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 1,
    });

    const { getByTestId } = render(<MenuScreen />);

    const tierChildren = getByTestId('plan-tier-label').props.children;
    const tierText = Array.isArray(tierChildren) ? tierChildren.join('') : tierChildren;
    expect(tierText).toContain('Essai');

    expect(getByTestId('plan-gemini-usage')).toBeTruthy();
  });

  it('shows premium tier with unlimited', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'premium',
      trialDaysRemaining: null,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: Infinity,
      geminiQuotaRemaining: Infinity,
    });

    const { getByTestId, queryByTestId } = render(<MenuScreen />);

    const tierChildren = getByTestId('plan-tier-label').props.children;
    const tierText = Array.isArray(tierChildren) ? tierChildren.join('') : tierChildren;
    expect(tierText).toContain('Premium');

    expect(getByTestId('plan-unlimited')).toBeTruthy();
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
    });

    const { getByTestId } = render(<MenuScreen />);
    expect(getByTestId('plan-upgrade-button')).toBeTruthy();
  });

  it('does not render section when planStatus is null', () => {
    mockUsePlanStatus.mockReturnValue(null);

    const { queryByTestId } = render(<MenuScreen />);
    expect(queryByTestId('plan-usage-section')).toBeNull();
  });
});
