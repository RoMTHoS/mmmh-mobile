import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useUserPlan,
  useActivateTrial,
  useActivatePremium,
  useImportUsage,
  useIncrementUsage,
} from '../../src/hooks/usePlan';
import * as planDb from '../../src/services/planDatabase';
import * as planSync from '../../src/services/planSync';
import type { UserPlan, ImportUsage } from '../../src/types';

jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('../../src/services/planDatabase');
jest.mock('../../src/services/planSync');

const mockPlanDb = planDb as jest.Mocked<typeof planDb>;
const mockPlanSync = planSync as jest.Mocked<typeof planSync>;

const mockPlan: UserPlan = {
  id: 'plan-1',
  tier: 'free',
  trialStartDate: null,
  trialEndsDate: null,
  premiumActivatedDate: null,
  promoCode: null,
  premiumSource: null,
  subscriptionStatus: null,
  expiresAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockUsage: ImportUsage = {
  id: 'usage-1',
  date: '2026-02-16',
  vpsImportsUsed: 3,
  geminiImportsUsed: 0,
  weekStartDate: '2026-02-16',
  createdAt: '2026-02-16T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('Plan Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useUserPlan', () => {
    it('should fetch user plan', async () => {
      mockPlanDb.getUserPlan.mockResolvedValue(mockPlan);

      const { result } = renderHook(() => useUserPlan(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPlan);
    });

    it('should handle error', async () => {
      mockPlanDb.getUserPlan.mockRejectedValue(new Error('DB error'));

      const { result } = renderHook(() => useUserPlan(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useActivateTrial', () => {
    it('should activate trial via sync', async () => {
      const trialPlan: UserPlan = {
        ...mockPlan,
        tier: 'trial',
        trialStartDate: '2026-02-16T00:00:00.000Z',
        trialEndsDate: '2026-02-23T00:00:00.000Z',
      };
      mockPlanSync.syncActivateTrial.mockResolvedValue(trialPlan);

      const { result } = renderHook(() => useActivateTrial(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPlanSync.syncActivateTrial).toHaveBeenCalledTimes(1);
    });
  });

  describe('useActivatePremium', () => {
    it('should activate premium via sync with promo code', async () => {
      const premiumPlan: UserPlan = {
        ...mockPlan,
        tier: 'premium',
        promoCode: 'PROMO123',
        premiumActivatedDate: '2026-02-16T00:00:00.000Z',
      };
      mockPlanSync.syncActivatePremium.mockResolvedValue(premiumPlan);

      const { result } = renderHook(() => useActivatePremium(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('PROMO123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPlanSync.syncActivatePremium).toHaveBeenCalledWith('PROMO123');
    });
  });

  describe('useImportUsage', () => {
    it('should fetch today usage and week total', async () => {
      mockPlanDb.getTodayUsage.mockResolvedValue(mockUsage);
      mockPlanDb.getWeekUsage.mockResolvedValue(5);

      const { result } = renderHook(() => useImportUsage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        today: mockUsage,
        weekTotal: 5,
      });
    });
  });

  describe('useIncrementUsage', () => {
    it('should increment VPS usage', async () => {
      mockPlanDb.incrementVpsUsage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useIncrementUsage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('vps');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPlanDb.incrementVpsUsage).toHaveBeenCalledTimes(1);
    });

    it('should increment Gemini usage', async () => {
      mockPlanDb.incrementGeminiUsage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useIncrementUsage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('gemini');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPlanDb.incrementGeminiUsage).toHaveBeenCalledTimes(1);
    });
  });
});
