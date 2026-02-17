import Toast from 'react-native-toast-message';
import type { PlanStatus } from '../../src/types';

// Mock usePlanStatus
const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();
jest.mock('../../src/hooks/usePlan', () => ({
  usePlanStatus: () => mockUsePlanStatus(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Import after mocks
import { usePipelinePreCheck } from '../../src/hooks/usePipelinePreCheck';

describe('usePipelinePreCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when plan status is null', () => {
    mockUsePlanStatus.mockReturnValue(null);

    const check = usePipelinePreCheck();
    check();

    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('does nothing for free tier', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: 0,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 5,
      geminiQuotaRemaining: 0,
    });

    const check = usePipelinePreCheck();
    check();

    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('does nothing for premium tier', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'premium',
      trialDaysRemaining: 0,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 50,
      geminiQuotaRemaining: 10,
    });

    const check = usePipelinePreCheck();
    check();

    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('does nothing for trial tier with remaining Gemini quota', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 1,
    });

    const check = usePipelinePreCheck();
    check();

    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('shows info Toast for trial tier with exhausted Gemini quota', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 3,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 8,
      geminiQuotaRemaining: 0,
    });

    const check = usePipelinePreCheck();
    check();

    expect(Toast.show).toHaveBeenCalledTimes(1);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        text1: 'Import standard',
        visibilityTime: 4000,
      })
    );
  });

  it('shows info Toast when geminiQuotaRemaining is negative', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 2,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 5,
      geminiQuotaRemaining: -1,
    });

    const check = usePipelinePreCheck();
    check();

    expect(Toast.show).toHaveBeenCalledTimes(1);
  });
});
