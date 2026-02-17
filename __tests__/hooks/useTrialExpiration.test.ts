import Toast from 'react-native-toast-message';
import type { UserPlan } from '../../src/types';

const mockTrackEvent = jest.fn();

jest.mock('../../src/utils/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Mock useUserPlan to return controlled data
let mockPlanData: UserPlan | undefined;
jest.mock('../../src/hooks/usePlan', () => ({
  useUserPlan: () => ({ data: mockPlanData }),
}));

// Minimal renderHook replacement using React
import React from 'react';

// We need a way to trigger re-renders. Since we can't use @testing-library/react-hooks easily
// in this setup, we test the hook logic directly via module-level mock changes.
// But we still need to call useEffect — so let's import and run the hook via a test component.

function TestComponent() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useTrialExpiration } = require('../../src/hooks/useTrialExpiration');
  useTrialExpiration();
  return null;
}

// Use @testing-library/react-native to render
import { render } from '@testing-library/react-native';

describe('useTrialExpiration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlanData = undefined;
  });

  it('does nothing when plan is null', () => {
    mockPlanData = undefined;

    render(React.createElement(TestComponent));

    expect(Toast.show).not.toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does nothing on first render with free tier', () => {
    mockPlanData = {
      id: '1',
      tier: 'free',
      trialStartDate: null,
      trialEndsDate: null,
      premiumActivatedDate: null,
      promoCode: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    render(React.createElement(TestComponent));

    // First render: previousTier is null, current is free → no transition detected
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('does nothing on first render with trial tier', () => {
    mockPlanData = {
      id: '1',
      tier: 'trial',
      trialStartDate: '2026-02-10T00:00:00Z',
      trialEndsDate: '2026-02-17T00:00:00Z',
      premiumActivatedDate: null,
      promoCode: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    render(React.createElement(TestComponent));

    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('shows notification on trial→free transition', () => {
    // First render as trial
    mockPlanData = {
      id: '1',
      tier: 'trial',
      trialStartDate: '2026-02-10T00:00:00Z',
      trialEndsDate: '2026-02-17T00:00:00Z',
      premiumActivatedDate: null,
      promoCode: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const { rerender } = render(React.createElement(TestComponent));

    expect(Toast.show).not.toHaveBeenCalled();

    // Re-render with free (expired)
    mockPlanData = {
      ...mockPlanData,
      tier: 'free',
    };

    rerender(React.createElement(TestComponent));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        text1: 'Essai Premium termine',
      })
    );
    expect(mockTrackEvent).toHaveBeenCalledWith('trial_expired', expect.any(Object));
  });

  it('does not show notification on free→premium transition', () => {
    mockPlanData = {
      id: '1',
      tier: 'free',
      trialStartDate: '2026-02-10T00:00:00Z',
      trialEndsDate: '2026-02-17T00:00:00Z',
      premiumActivatedDate: null,
      promoCode: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const { rerender } = render(React.createElement(TestComponent));

    mockPlanData = { ...mockPlanData, tier: 'premium' };
    rerender(React.createElement(TestComponent));

    expect(Toast.show).not.toHaveBeenCalled();
  });
});
