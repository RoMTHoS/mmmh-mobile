import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import type { UserPlan, PlanStatus } from '../../../src/types';

// --- Mocks ---

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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const freePlanStatus: PlanStatus = {
  tier: 'free',
  trialDaysRemaining: null,
  isTrialExpired: false,
  canUsePremium: false,
  vpsQuotaRemaining: 10,
  geminiQuotaRemaining: 0,
  storeSubscription: null,
};

const mockUseUserPlan = jest.fn();
const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();
const mockActivateTrial = jest.fn();

jest.mock('../../../src/hooks', () => ({
  useUserPlan: () => mockUseUserPlan(),
  usePlanStatus: () => mockUsePlanStatus(),
  useActivateTrial: () => ({
    mutate: mockActivateTrial,
    isPending: false,
  }),
}));

jest.mock('../../../src/utils/planStateMachine', () => ({
  canActivateTrial: (plan: UserPlan) => plan.trialStartDate === null,
}));

jest.mock('../../../src/utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

const mockToastShow = jest.fn();
jest.mock('../../../src/utils/toast', () => ({
  Toast: { show: (...args: unknown[]) => mockToastShow(...args) },
}));

// Import after mocks
import { TrialBanner } from '../../../src/components/import/TrialBanner';

describe('TrialBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPlan.mockReturnValue({ data: mockPlan });
    mockUsePlanStatus.mockReturnValue(freePlanStatus);
  });

  it('renders banner for eligible free-tier user', () => {
    const { getByTestId, getByText } = render(<TrialBanner />);

    expect(getByTestId('trial-banner')).toBeTruthy();
    expect(getByText(/qualite Premium gratuitement/)).toBeTruthy();
    expect(getByTestId('trial-activate-button')).toBeTruthy();
  });

  it('hides banner when plan is null', () => {
    mockUseUserPlan.mockReturnValue({ data: null });

    const { queryByTestId } = render(<TrialBanner />);
    expect(queryByTestId('trial-banner')).toBeNull();
  });

  it('hides banner when planStatus is null', () => {
    mockUsePlanStatus.mockReturnValue(null);

    const { queryByTestId } = render(<TrialBanner />);
    expect(queryByTestId('trial-banner')).toBeNull();
  });

  it('hides banner for trial-tier user', () => {
    mockUsePlanStatus.mockReturnValue({ ...freePlanStatus, tier: 'trial' });

    const { queryByTestId } = render(<TrialBanner />);
    expect(queryByTestId('trial-banner')).toBeNull();
  });

  it('hides banner for premium-tier user', () => {
    mockUsePlanStatus.mockReturnValue({ ...freePlanStatus, tier: 'premium' });

    const { queryByTestId } = render(<TrialBanner />);
    expect(queryByTestId('trial-banner')).toBeNull();
  });

  it('hides banner for user who already used trial', () => {
    mockUseUserPlan.mockReturnValue({
      data: { ...mockPlan, trialStartDate: '2026-01-15T00:00:00Z' },
    });

    const { queryByTestId } = render(<TrialBanner />);
    expect(queryByTestId('trial-banner')).toBeNull();
  });

  it('calls activateTrial on button press', () => {
    const { getByTestId } = render(<TrialBanner />);

    fireEvent.press(getByTestId('trial-activate-button'));

    expect(mockActivateTrial).toHaveBeenCalledTimes(1);
  });

  it('shows success toast on activation', () => {
    mockActivateTrial.mockImplementation((_: undefined, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });

    const { getByTestId } = render(<TrialBanner />);
    fireEvent.press(getByTestId('trial-activate-button'));

    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        text1: 'Essai Premium active !',
      })
    );
  });

  it('shows error toast when trial already used', () => {
    mockActivateTrial.mockImplementation((_: undefined, opts: { onError: (e: Error) => void }) => {
      opts.onError(new Error("L'essai gratuit a deja ete utilise."));
    });

    const { getByTestId } = render(<TrialBanner />);
    fireEvent.press(getByTestId('trial-activate-button'));

    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: 'Essai indisponible',
      })
    );
  });

  it('shows network error toast on unknown error', () => {
    mockActivateTrial.mockImplementation((_: undefined, opts: { onError: (e: Error) => void }) => {
      opts.onError(new Error('Network timeout'));
    });

    const { getByTestId } = render(<TrialBanner />);
    fireEvent.press(getByTestId('trial-activate-button'));

    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: 'Erreur',
      })
    );
  });
});
