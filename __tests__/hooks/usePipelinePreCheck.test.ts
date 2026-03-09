import type { PlanStatus } from '../../src/types';

// Mock usePlanStatus
const mockUsePlanStatus = jest.fn<PlanStatus | null, []>();
jest.mock('../../src/hooks/usePlan', () => ({
  usePlanStatus: () => mockUsePlanStatus(),
}));

const mockToastShow = jest.fn();
jest.mock('../../src/utils/toast', () => ({
  Toast: { show: (...args: unknown[]) => mockToastShow(...args) },
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

    expect(mockToastShow).not.toHaveBeenCalled();
  });

  it('does nothing for free tier with remaining Gemini quota', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: 0,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 5,
      geminiQuotaRemaining: 2,
      storeSubscription: null,
    });

    const check = usePipelinePreCheck();
    check();

    expect(mockToastShow).not.toHaveBeenCalled();
  });

  it('shows info Toast for free tier with exhausted Gemini quota', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'free',
      trialDaysRemaining: 0,
      isTrialExpired: false,
      canUsePremium: false,
      vpsQuotaRemaining: 5,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const check = usePipelinePreCheck();
    check();

    expect(mockToastShow).toHaveBeenCalledTimes(1);
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        text1: 'Import standard',
      })
    );
  });

  it('does nothing for premium tier', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'premium',
      trialDaysRemaining: 0,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 50,
      geminiQuotaRemaining: 10,
      storeSubscription: null,
    });

    const check = usePipelinePreCheck();
    check();

    expect(mockToastShow).not.toHaveBeenCalled();
  });

  it('does nothing for trial tier with remaining Gemini quota', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 5,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 10,
      geminiQuotaRemaining: 1,
      storeSubscription: null,
    });

    const check = usePipelinePreCheck();
    check();

    expect(mockToastShow).not.toHaveBeenCalled();
  });

  it('shows info Toast for trial tier with exhausted Gemini quota', () => {
    mockUsePlanStatus.mockReturnValue({
      tier: 'trial',
      trialDaysRemaining: 3,
      isTrialExpired: false,
      canUsePremium: true,
      vpsQuotaRemaining: 8,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    });

    const check = usePipelinePreCheck();
    check();

    expect(mockToastShow).toHaveBeenCalledTimes(1);
    expect(mockToastShow).toHaveBeenCalledWith(
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
      storeSubscription: null,
    });

    const check = usePipelinePreCheck();
    check();

    expect(mockToastShow).toHaveBeenCalledTimes(1);
  });
});
