import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import type { PlanStatus, UserPlan } from '../../../src/types';

const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();
const mockUseUserPlan = jest.fn();
const mockCanActivateTrial = jest.fn<boolean, [UserPlan]>();

jest.mock('../../../src/hooks', () => ({
  usePlanStatus: () => mockUsePlanStatus(),
}));

jest.mock('../../../src/hooks/usePlan', () => ({
  useUserPlan: () => mockUseUserPlan(),
}));

jest.mock('../../../src/hooks/usePurchase', () => ({
  useOfferings: () => ({
    offerings: null,
    priceString: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../src/utils/planStateMachine', () => ({
  canActivateTrial: (plan: UserPlan) => mockCanActivateTrial(plan),
}));

import { QuotaExceededModal } from '../../../src/components/import/QuotaExceededModal';

const mockPlan: UserPlan = {
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

describe('QuotaExceededModal', () => {
  const onClose = jest.fn();
  const onUpgrade = jest.fn();
  const onStartTrial = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPlan.mockReturnValue({ data: mockPlan });
    mockCanActivateTrial.mockReturnValue(false);
  });

  it('renders modal with correct message', () => {
    const { getByTestId } = render(
      <QuotaExceededModal visible onClose={onClose} onUpgrade={onUpgrade} />
    );

    expect(getByTestId('quota-exceeded-modal')).toBeTruthy();
    expect(getByTestId('quota-exceeded-title')).toBeTruthy();
    expect(getByTestId('quota-exceeded-message').props.children).toContain('10 imports');
  });

  it('calls onUpgrade when Premium button pressed', () => {
    const { getByTestId } = render(
      <QuotaExceededModal visible onClose={onClose} onUpgrade={onUpgrade} />
    );

    fireEvent.press(getByTestId('quota-exceeded-upgrade'));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Fermer pressed', () => {
    const { getByTestId } = render(
      <QuotaExceededModal visible onClose={onClose} onUpgrade={onUpgrade} />
    );

    fireEvent.press(getByTestId('quota-exceeded-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows trial button when trial is available', () => {
    mockCanActivateTrial.mockReturnValue(true);

    const { getByTestId } = render(
      <QuotaExceededModal
        visible
        onClose={onClose}
        onUpgrade={onUpgrade}
        onStartTrial={onStartTrial}
      />
    );

    expect(getByTestId('quota-exceeded-trial')).toBeTruthy();
    fireEvent.press(getByTestId('quota-exceeded-trial'));
    expect(onStartTrial).toHaveBeenCalledTimes(1);
  });

  it('hides trial button when trial already used', () => {
    mockCanActivateTrial.mockReturnValue(false);

    const { queryByTestId } = render(
      <QuotaExceededModal
        visible
        onClose={onClose}
        onUpgrade={onUpgrade}
        onStartTrial={onStartTrial}
      />
    );

    expect(queryByTestId('quota-exceeded-trial')).toBeNull();
  });

  it('does not render content when not visible', () => {
    const { queryByTestId } = render(
      <QuotaExceededModal visible={false} onClose={onClose} onUpgrade={onUpgrade} />
    );

    // Modal with visible=false hides its children
    expect(queryByTestId('quota-exceeded-modal')).toBeNull();
  });
});
