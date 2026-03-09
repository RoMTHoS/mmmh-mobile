jest.mock('react-native-purchases');
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import Purchases from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import {
  initRevenueCat,
  getCustomerInfo,
  isPremiumActive,
  getSubscriptionStatus,
  addEntitlementListener,
  isRevenueCatInitialized,
  REVENUECAT_ENTITLEMENT_ID,
  __resetForTesting,
} from '../../src/services/revenueCat';

const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

// Helper to create mock CustomerInfo
function mockCustomerInfo(overrides: Partial<CustomerInfo> = {}): CustomerInfo {
  return {
    entitlements: { active: {}, all: {} },
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
    latestExpirationDate: null,
    firstSeen: '2026-01-01T00:00:00.000Z',
    originalAppUserId: 'test-device',
    requestDate: '2026-03-06T00:00:00.000Z',
    originalApplicationVersion: null,
    originalPurchaseDate: null,
    managementURL: null,
    nonSubscriptionTransactions: [],
    allExpirationDates: {},
    allPurchaseDates: {},
    ...overrides,
  } as CustomerInfo;
}

function mockPremiumCustomerInfo(): CustomerInfo {
  return mockCustomerInfo({
    entitlements: {
      active: {
        [REVENUECAT_ENTITLEMENT_ID]: {
          identifier: REVENUECAT_ENTITLEMENT_ID,
          isActive: true,
          willRenew: true,
          periodType: 'NORMAL',
          latestPurchaseDate: '2026-03-01T00:00:00.000Z',
          latestPurchaseDateMillis: Date.now(),
          originalPurchaseDate: '2026-03-01T00:00:00.000Z',
          originalPurchaseDateMillis: Date.now(),
          expirationDate: '2026-04-01T00:00:00.000Z',
          expirationDateMillis: Date.now() + 30 * 24 * 60 * 60 * 1000,
          store: 'APP_STORE',
          productIdentifier: 'mmmh_premium_monthly',
          isSandbox: false,
          unsubscribeDetectedAt: null,
          billingIssueDetectedAt: null,
          ownershipType: 'PURCHASED',
          productPlanIdentifier: null,
          verification: 'VERIFIED',
        },
      },
      all: {},
    },
  } as unknown as CustomerInfo);
}

describe('RevenueCat Service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Restore default mock behavior after resetAllMocks clears it
    mockPurchases.getCustomerInfo.mockResolvedValue({
      entitlements: { active: {} },
      activeSubscriptions: [],
    } as never);
    mockPurchases.addCustomerInfoUpdateListener.mockReturnValue(jest.fn() as never);
    __resetForTesting();
    // Set env vars for tests
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'rc_test_ios_key';
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY = 'rc_test_android_key';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  });

  describe('initRevenueCat', () => {
    it('should configure Purchases with iOS key and device ID', async () => {
      await initRevenueCat('test-device-123');

      expect(mockPurchases.configure).toHaveBeenCalledWith({
        apiKey: 'rc_test_ios_key',
        appUserID: 'test-device-123',
      });
      expect(isRevenueCatInitialized()).toBe(true);
    });

    it('should skip initialization when no API key is configured', async () => {
      delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;

      await initRevenueCat('test-device-123');

      expect(mockPurchases.configure).not.toHaveBeenCalled();
      expect(isRevenueCatInitialized()).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      mockPurchases.configure.mockImplementation(() => {
        throw new Error('SDK error');
      });

      // Should not throw
      await initRevenueCat('test-device-123');
      expect(isRevenueCatInitialized()).toBe(false);
    });
  });

  describe('getCustomerInfo', () => {
    it('should return null if SDK is not initialized', async () => {
      const result = await getCustomerInfo();
      expect(result).toBeNull();
    });

    it('should return customer info when initialized', async () => {
      await initRevenueCat('test-device');
      const info = mockCustomerInfo();
      mockPurchases.getCustomerInfo.mockResolvedValue(info);

      const result = await getCustomerInfo();
      expect(result).toEqual(info);
    });

    it('should return null on error', async () => {
      await initRevenueCat('test-device');
      mockPurchases.getCustomerInfo.mockRejectedValue(new Error('Network'));

      const result = await getCustomerInfo();
      expect(result).toBeNull();
    });
  });

  describe('isPremiumActive', () => {
    it('should return true when premium entitlement is active', () => {
      const info = mockPremiumCustomerInfo();
      expect(isPremiumActive(info)).toBe(true);
    });

    it('should return false when no active entitlements', () => {
      const info = mockCustomerInfo();
      expect(isPremiumActive(info)).toBe(false);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should extract subscription info from active entitlement', () => {
      const info = mockPremiumCustomerInfo();
      const status = getSubscriptionStatus(info);

      expect(status).toEqual({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-04-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'active',
      });
    });

    it('should return expired status when no entitlement', () => {
      const info = mockCustomerInfo();
      const status = getSubscriptionStatus(info);

      expect(status).toEqual({
        isActive: false,
        willRenew: false,
        expirationDate: null,
        store: null,
        productIdentifier: null,
        subscriptionStatus: 'expired',
      });
    });

    it('should detect cancelled subscription', () => {
      const info = mockPremiumCustomerInfo();
      const entitlement = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID] as unknown as Record<
        string,
        unknown
      >;
      entitlement.unsubscribeDetectedAt = '2026-03-05T00:00:00.000Z';

      const status = getSubscriptionStatus(info);
      expect(status.subscriptionStatus).toBe('cancelled');
      expect(status.willRenew).toBe(false);
    });

    it('should detect grace period (billing issue)', () => {
      const info = mockPremiumCustomerInfo();
      const entitlement = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID] as unknown as Record<
        string,
        unknown
      >;
      entitlement.billingIssueDetectedAt = '2026-03-05T00:00:00.000Z';

      const status = getSubscriptionStatus(info);
      expect(status.subscriptionStatus).toBe('grace_period');
    });
  });

  describe('addEntitlementListener', () => {
    it('should return no-op if not initialized', () => {
      const callback = jest.fn();
      const cleanup = addEntitlementListener(callback);

      expect(mockPurchases.addCustomerInfoUpdateListener).not.toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');
    });

    it('should register listener when initialized', async () => {
      await initRevenueCat('test-device');
      const callback = jest.fn();
      addEntitlementListener(callback);

      expect(mockPurchases.addCustomerInfoUpdateListener).toHaveBeenCalledWith(callback);
    });
  });
});
