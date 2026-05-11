/**
 * Tests for usePurchase hooks.
 * Mocks RevenueCat SDK and planSync.
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock revenueCat service
const mockGetOfferings = jest.fn();
const mockPurchaseSubscription = jest.fn();
const mockRestorePurchases = jest.fn();

jest.mock('../../src/services/revenueCat', () => ({
  getOfferings: (...args: unknown[]) => mockGetOfferings(...args),
  purchaseSubscription: (...args: unknown[]) => mockPurchaseSubscription(...args),
  restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
  isPremiumActive: jest.fn(),
}));

jest.mock('../../src/services/planSync', () => ({
  syncActivateFromStore: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../src/services/analytics', () => ({
  analytics: { track: jest.fn() },
}));

jest.mock('../../src/utils/analyticsEvents', () => ({
  EVENTS: {
    PURCHASE_INITIATED: 'Purchase Initiated',
    PURCHASE_COMPLETED: 'Purchase Completed',
    PURCHASE_CANCELLED: 'Purchase Cancelled',
    PURCHASE_FAILED: 'Purchase Failed',
    RESTORE_INITIATED: 'Restore Initiated',
    RESTORE_COMPLETED: 'Restore Completed',
    RESTORE_NOT_FOUND: 'Restore Not Found',
  },
}));

import {
  useOfferings,
  usePurchaseSubscription,
  useRestorePurchases,
} from '../../src/hooks/usePurchase';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useOfferings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns price string from offerings', async () => {
    mockGetOfferings.mockResolvedValue({
      current: {
        monthly: { product: { priceString: '4,99 €' } },
      },
    });

    const { result } = renderHook(() => useOfferings(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.priceString).toBe('4,99 €'));
  });

  it('returns null price when offerings fail', async () => {
    mockGetOfferings.mockResolvedValue(null);

    const { result } = renderHook(() => useOfferings(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.priceString).toBeNull();
  });
});

describe('usePurchaseSubscription', () => {
  beforeEach(() => jest.clearAllMocks());

  it('handles successful purchase', async () => {
    const customerInfo = {
      entitlements: {
        active: {
          premium: { productIdentifier: 'mmmh_premium_monthly' },
        },
      },
    };
    mockPurchaseSubscription.mockResolvedValue({ success: true, customerInfo });

    const { result } = renderHook(() => usePurchaseSubscription(), { wrapper: createWrapper() });

    let purchaseResult: unknown;
    await act(async () => {
      purchaseResult = await result.current.purchase('monthly');
    });

    expect((purchaseResult as { success: boolean }).success).toBe(true);
  });

  it('handles user cancellation', async () => {
    mockPurchaseSubscription.mockResolvedValue({ success: false, userCancelled: true });

    const { result } = renderHook(() => usePurchaseSubscription(), { wrapper: createWrapper() });

    let purchaseResult: unknown;
    await act(async () => {
      purchaseResult = await result.current.purchase('monthly');
    });

    expect((purchaseResult as { userCancelled: boolean }).userCancelled).toBe(true);
  });

  it('handles payment failure', async () => {
    mockPurchaseSubscription.mockResolvedValue({ success: false, error: 'Payment declined' });

    const { result } = renderHook(() => usePurchaseSubscription(), { wrapper: createWrapper() });

    let purchaseResult: unknown;
    await act(async () => {
      purchaseResult = await result.current.purchase('monthly');
    });

    expect((purchaseResult as { error: string }).error).toBe('Payment declined');
  });
});

describe('useRestorePurchases', () => {
  beforeEach(() => jest.clearAllMocks());

  it('handles restored purchases', async () => {
    const customerInfo = {
      entitlements: { active: { premium: {} } },
    };
    mockRestorePurchases.mockResolvedValue({ restored: true, customerInfo });

    const { result } = renderHook(() => useRestorePurchases(), { wrapper: createWrapper() });

    let restoreResult: unknown;
    await act(async () => {
      restoreResult = await result.current.restore();
    });

    expect((restoreResult as { restored: boolean }).restored).toBe(true);
  });

  it('handles no purchases found', async () => {
    mockRestorePurchases.mockResolvedValue({ restored: false });

    const { result } = renderHook(() => useRestorePurchases(), { wrapper: createWrapper() });

    let restoreResult: unknown;
    await act(async () => {
      restoreResult = await result.current.restore();
    });

    expect((restoreResult as { restored: boolean }).restored).toBe(false);
  });
});
