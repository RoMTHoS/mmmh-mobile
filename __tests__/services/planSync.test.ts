jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('react-native-purchases');
jest.mock('../../src/services/planDatabase');
jest.mock('../../src/services/revenueCat');

const mockTrack = jest.fn();
jest.mock('../../src/services/analytics', () => ({
  analytics: { track: mockTrack },
}));

jest.mock('../../src/utils/analyticsEvents', () => ({
  EVENTS: {
    SUBSCRIPTION_RENEWED: 'Subscription Renewed',
    SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
    SUBSCRIPTION_EXPIRED: 'Subscription Expired',
    BILLING_ISSUE_DETECTED: 'Billing Issue Detected',
    BILLING_ISSUE_RESOLVED: 'Billing Issue Resolved',
  },
}));

import * as planSync from '../../src/services/planSync';
import * as planDb from '../../src/services/planDatabase';
import * as revenueCat from '../../src/services/revenueCat';
import type { UserPlan } from '../../src/types';

const mockPlanDb = planDb as jest.Mocked<typeof planDb>;
const mockRC = revenueCat as jest.Mocked<typeof revenueCat>;

const freePlan: UserPlan = {
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

const trialPlan: UserPlan = {
  ...freePlan,
  tier: 'trial',
  trialStartDate: '2026-02-16T00:00:00.000Z',
  trialEndsDate: '2026-02-23T00:00:00.000Z',
};

const promoPremiumPlan: UserPlan = {
  ...freePlan,
  tier: 'premium',
  premiumActivatedDate: '2026-02-16T00:00:00.000Z',
  promoCode: 'PROMO123',
  premiumSource: 'promo',
};

const storePremiumPlan: UserPlan = {
  ...freePlan,
  tier: 'premium',
  premiumActivatedDate: '2026-03-01T00:00:00.000Z',
  premiumSource: 'store',
  subscriptionStatus: 'active',
  expiresAt: '2026-04-01T00:00:00.000Z',
};

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock CustomerInfo helper
function mockPremiumCustomerInfo() {
  return {
    entitlements: {
      active: {
        premium: {
          identifier: 'premium',
          isActive: true,
          willRenew: true,
          store: 'APP_STORE',
          productIdentifier: 'mmmh_premium_monthly',
          expirationDate: '2026-04-01T00:00:00.000Z',
          unsubscribeDetectedAt: null,
          billingIssueDetectedAt: null,
        },
      },
      all: {},
    },
    activeSubscriptions: ['mmmh_premium_monthly'],
  };
}

function mockFreeCustomerInfo() {
  return {
    entitlements: { active: {}, all: {} },
    activeSubscriptions: [],
  };
}

describe('Plan Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    planSync.setDeviceId('test-device-123');
    // Default: RC returns null (not initialized)
    mockRC.getCustomerInfo.mockResolvedValue(null);
    mockRC.isPremiumActive.mockReturnValue(false);
    mockRC.getSubscriptionStatus.mockReturnValue({
      isActive: false,
      willRenew: false,
      expirationDate: null,
      store: null,
      productIdentifier: null,
      subscriptionStatus: 'expired',
    });
  });

  describe('syncPlan', () => {
    it('should use RevenueCat premium when entitlement is active', async () => {
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(true);
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-04-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'active',
      });
      mockPlanDb.activateStorePremium.mockResolvedValue(storePremiumPlan);
      mockPlanDb.getUserPlan.mockResolvedValue(storePremiumPlan);

      const result = await planSync.syncPlan();

      expect(mockPlanDb.activateStorePremium).toHaveBeenCalledWith(
        'active',
        '2026-04-01T00:00:00.000Z'
      );
      expect(result).toEqual(storePremiumPlan);
      // Should NOT call backend fetch
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fall back to backend when RevenueCat returns no entitlement', async () => {
      const customerInfo = mockFreeCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan.mockResolvedValue(freePlan);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: { tier: 'free' } }),
      });

      const result = await planSync.syncPlan();

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual(freePlan);
    });

    it('should use offline fallback when both RC and backend are unavailable', async () => {
      mockRC.getCustomerInfo.mockResolvedValue(null);
      mockPlanDb.getUserPlan.mockResolvedValue(freePlan);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await planSync.syncPlan();

      expect(result).toEqual(freePlan);
    });

    it('should downgrade store premium when RC shows no entitlement', async () => {
      const customerInfo = mockFreeCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan
        .mockResolvedValueOnce(storePremiumPlan) // check promo protection
        .mockResolvedValueOnce(freePlan) // after deactivation, in syncFromBackend
        .mockResolvedValueOnce(freePlan); // final return
      mockPlanDb.deactivatePremium.mockResolvedValue(freePlan);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: { tier: 'free' } }),
      });

      await planSync.syncPlan();

      expect(mockPlanDb.deactivatePremium).toHaveBeenCalled();
    });

    it('should NOT downgrade promo premium when RC shows no entitlement', async () => {
      const customerInfo = mockFreeCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan.mockResolvedValue(promoPremiumPlan);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: { tier: 'premium', promo_code: 'PROMO123' } }),
      });

      const result = await planSync.syncPlan();

      // Should NOT deactivate premium
      expect(mockPlanDb.deactivatePremium).not.toHaveBeenCalled();
      expect(result).toEqual(promoPremiumPlan);
    });
  });

  describe('syncPlanFromBackend (backward compat)', () => {
    it('should be aliased to syncPlan', () => {
      expect(planSync.syncPlanFromBackend).toBe(planSync.syncPlan);
    });
  });

  describe('syncActivateTrial', () => {
    it('should activate trial locally and sync to backend', async () => {
      mockPlanDb.activateTrial.mockResolvedValue(trialPlan);
      mockFetch.mockResolvedValue({ ok: true });

      const result = await planSync.syncActivateTrial();

      expect(result).toEqual(trialPlan);
      expect(mockPlanDb.activateTrial).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/plan/test-device-123/activate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'trial' }),
        })
      );
    });

    it('should return local plan even if backend sync fails', async () => {
      mockPlanDb.activateTrial.mockResolvedValue(trialPlan);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await planSync.syncActivateTrial();

      expect(result).toEqual(trialPlan);
    });
  });

  describe('syncActivatePremium', () => {
    it('should activate premium locally and sync to backend', async () => {
      mockPlanDb.activatePremium.mockResolvedValue(promoPremiumPlan);
      mockFetch.mockResolvedValue({ ok: true });

      const result = await planSync.syncActivatePremium('PROMO123');

      expect(result).toEqual(promoPremiumPlan);
      expect(mockPlanDb.activatePremium).toHaveBeenCalledWith('PROMO123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/plan/test-device-123/activate'),
        expect.objectContaining({
          body: JSON.stringify({ action: 'premium', promo_code: 'PROMO123' }),
        })
      );
    });

    it('should return local plan even if backend sync fails (network error)', async () => {
      mockPlanDb.activatePremium.mockResolvedValue(promoPremiumPlan);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await planSync.syncActivatePremium('PROMO123');

      expect(result).toEqual(promoPremiumPlan);
    });

    it('should revert local plan and throw when backend rejects promo code', async () => {
      mockPlanDb.activatePremium.mockResolvedValue(promoPremiumPlan);
      mockPlanDb.deactivatePremium.mockResolvedValue(freePlan);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'INVALID_PROMO_CODE' }),
      });

      await expect(planSync.syncActivatePremium('BAD_CODE')).rejects.toThrow(
        'Premium activation failed: INVALID_PROMO_CODE'
      );
      expect(mockPlanDb.deactivatePremium).toHaveBeenCalled();
    });

    it('should revert local plan when backend returns conflict', async () => {
      mockPlanDb.activatePremium.mockResolvedValue(promoPremiumPlan);
      mockPlanDb.deactivatePremium.mockResolvedValue(freePlan);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'PLAN_ALREADY_ACTIVE' }),
      });

      await expect(planSync.syncActivatePremium('PROMO123')).rejects.toThrow(
        'Premium activation failed: PLAN_ALREADY_ACTIVE'
      );
      expect(mockPlanDb.deactivatePremium).toHaveBeenCalled();
    });
  });

  describe('syncActivateFromStore', () => {
    it('should update local SQLite and notify backend', async () => {
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-04-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'active',
      });
      mockPlanDb.activateStorePremium.mockResolvedValue(storePremiumPlan);
      mockFetch.mockResolvedValue({ ok: true });

      const result = await planSync.syncActivateFromStore(customerInfo as never);

      expect(mockPlanDb.activateStorePremium).toHaveBeenCalledWith(
        'active',
        '2026-04-01T00:00:00.000Z'
      );
      expect(result).toEqual(storePremiumPlan);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/plan/test-device-123/activate'),
        expect.objectContaining({
          body: JSON.stringify({ action: 'premium', source: 'store' }),
        })
      );
    });
  });

  describe('handleCustomerInfoUpdate', () => {
    it('should activate store premium when RC shows new entitlement', async () => {
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(true);
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-04-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'active',
      });
      mockPlanDb.getUserPlan.mockResolvedValue(freePlan);
      mockPlanDb.activateStorePremium.mockResolvedValue(storePremiumPlan);
      mockFetch.mockResolvedValue({ ok: true });

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockPlanDb.activateStorePremium).toHaveBeenCalled();
    });

    it('should downgrade when RC entitlement lost and source was store', async () => {
      const customerInfo = mockFreeCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan.mockResolvedValue(storePremiumPlan);
      mockPlanDb.deactivatePremium.mockResolvedValue(freePlan);

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockPlanDb.deactivatePremium).toHaveBeenCalled();
    });

    it('should NOT downgrade when RC entitlement lost but source is promo', async () => {
      const customerInfo = mockFreeCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan.mockResolvedValue(promoPremiumPlan);

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockPlanDb.deactivatePremium).not.toHaveBeenCalled();
    });
  });

  describe('handleCustomerInfoUpdate — lifecycle analytics', () => {
    it('should track SUBSCRIPTION_RENEWED when status goes from cancelled to active', async () => {
      const cancelledStorePlan: UserPlan = {
        ...storePremiumPlan,
        subscriptionStatus: 'cancelled',
      };
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(true);
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-05-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'active',
      });
      mockPlanDb.getUserPlan.mockResolvedValue(cancelledStorePlan);
      mockPlanDb.activateStorePremium.mockResolvedValue(storePremiumPlan);

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockTrack).toHaveBeenCalledWith('Subscription Renewed');
    });

    it('should track SUBSCRIPTION_CANCELLED when status goes from active to cancelled', async () => {
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(true);
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: false,
        expirationDate: '2026-04-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'cancelled',
      });
      mockPlanDb.getUserPlan.mockResolvedValue(storePremiumPlan);
      mockPlanDb.activateStorePremium.mockResolvedValue({
        ...storePremiumPlan,
        subscriptionStatus: 'cancelled',
      });

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockTrack).toHaveBeenCalledWith('Subscription Cancelled');
    });

    it('should track BILLING_ISSUE_DETECTED when status goes to grace_period', async () => {
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(true);
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-04-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'grace_period',
      });
      mockPlanDb.getUserPlan.mockResolvedValue(storePremiumPlan);
      mockPlanDb.activateStorePremium.mockResolvedValue({
        ...storePremiumPlan,
        subscriptionStatus: 'grace_period',
      });

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockTrack).toHaveBeenCalledWith('Billing Issue Detected');
    });

    it('should track BILLING_ISSUE_RESOLVED and SUBSCRIPTION_RENEWED when grace → active', async () => {
      const gracePlan: UserPlan = {
        ...storePremiumPlan,
        subscriptionStatus: 'grace_period',
      };
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(true);
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-05-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'active',
      });
      mockPlanDb.getUserPlan.mockResolvedValue(gracePlan);
      mockPlanDb.activateStorePremium.mockResolvedValue(storePremiumPlan);

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockTrack).toHaveBeenCalledWith('Billing Issue Resolved');
      expect(mockTrack).toHaveBeenCalledWith('Subscription Renewed');
    });

    it('should track SUBSCRIPTION_EXPIRED when entitlement lost for store premium', async () => {
      const customerInfo = mockFreeCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan.mockResolvedValue(storePremiumPlan);
      mockPlanDb.deactivatePremium.mockResolvedValue(freePlan);

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockTrack).toHaveBeenCalledWith('Subscription Expired');
      expect(mockPlanDb.deactivatePremium).toHaveBeenCalled();
    });

    it('should NOT track analytics when status unchanged (active → active)', async () => {
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.isPremiumActive.mockReturnValue(true);
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-04-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'active',
      });
      mockPlanDb.getUserPlan.mockResolvedValue(storePremiumPlan);
      mockPlanDb.activateStorePremium.mockResolvedValue(storePremiumPlan);

      await planSync.handleCustomerInfoUpdate(customerInfo as never);

      expect(mockTrack).not.toHaveBeenCalled();
    });
  });

  describe('syncPlan — promo migration', () => {
    it('should infer premiumSource=promo for legacy plan with promoCode', async () => {
      const legacyPlan: UserPlan = {
        ...freePlan,
        tier: 'premium',
        premiumActivatedDate: '2026-02-01T00:00:00.000Z',
        promoCode: 'BETA-2026',
        premiumSource: null,
      };
      const customerInfo = mockFreeCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan.mockResolvedValue(legacyPlan);
      mockPlanDb.updatePremiumSource.mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          plan: { tier: 'premium', promo_code: 'BETA-2026', premium_source: 'promo' },
        }),
      });

      await planSync.syncPlan();

      expect(mockPlanDb.updatePremiumSource).toHaveBeenCalledWith('promo');
      expect(mockPlanDb.deactivatePremium).not.toHaveBeenCalled();
    });

    it('should NOT infer premiumSource for legacy plan without promoCode', async () => {
      const legacyPlan: UserPlan = {
        ...freePlan,
        tier: 'premium',
        premiumActivatedDate: '2026-02-01T00:00:00.000Z',
        premiumSource: null,
      };
      const customerInfo = mockFreeCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan.mockResolvedValue(legacyPlan);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: { tier: 'premium' } }),
      });

      await planSync.syncPlan();

      expect(mockPlanDb.updatePremiumSource).not.toHaveBeenCalled();
    });
  });

  describe('syncPlan — lifecycle transitions', () => {
    it('purchase → active → renewal keeps premium with new expiration', async () => {
      const customerInfo = mockPremiumCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(true);
      mockRC.getSubscriptionStatus.mockReturnValue({
        isActive: true,
        willRenew: true,
        expirationDate: '2026-05-01T00:00:00.000Z',
        store: 'app_store',
        productIdentifier: 'mmmh_premium_monthly',
        subscriptionStatus: 'active',
      });
      mockPlanDb.activateStorePremium.mockResolvedValue({
        ...storePremiumPlan,
        expiresAt: '2026-05-01T00:00:00.000Z',
      });
      mockPlanDb.getUserPlan.mockResolvedValue({
        ...storePremiumPlan,
        expiresAt: '2026-05-01T00:00:00.000Z',
      });

      const result = await planSync.syncPlan();

      expect(result.tier).toBe('premium');
      expect(result.expiresAt).toBe('2026-05-01T00:00:00.000Z');
    });

    it('expired store subscription → free tier', async () => {
      const customerInfo = mockFreeCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan
        .mockResolvedValueOnce(storePremiumPlan)
        .mockResolvedValueOnce(freePlan)
        .mockResolvedValueOnce(freePlan);
      mockPlanDb.deactivatePremium.mockResolvedValue(freePlan);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: { tier: 'free' } }),
      });

      const result = await planSync.syncPlan();

      expect(mockPlanDb.deactivatePremium).toHaveBeenCalled();
      expect(result.tier).toBe('free');
    });

    it('promo premium unaffected by RevenueCat (no store subscription)', async () => {
      const customerInfo = mockFreeCustomerInfo();
      mockRC.getCustomerInfo.mockResolvedValue(customerInfo as never);
      mockRC.isPremiumActive.mockReturnValue(false);
      mockPlanDb.getUserPlan.mockResolvedValue(promoPremiumPlan);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: { tier: 'premium', promo_code: 'PROMO123' } }),
      });

      const result = await planSync.syncPlan();

      expect(mockPlanDb.deactivatePremium).not.toHaveBeenCalled();
      expect(result.tier).toBe('premium');
    });

    it('app launch offline with cached premium → premium (cached)', async () => {
      mockRC.getCustomerInfo.mockResolvedValue(null);
      mockPlanDb.getUserPlan.mockResolvedValue(storePremiumPlan);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await planSync.syncPlan();

      expect(result.tier).toBe('premium');
    });

    it('should revert local plan and throw when backend rejects promo code', async () => {
      mockPlanDb.activatePremium.mockResolvedValue(promoPremiumPlan);
      mockPlanDb.deactivatePremium.mockResolvedValue(freePlan);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'INVALID_PROMO_CODE' }),
      });

      await expect(planSync.syncActivatePremium('BAD_CODE')).rejects.toThrow(
        'Premium activation failed: INVALID_PROMO_CODE'
      );
      expect(mockPlanDb.deactivatePremium).toHaveBeenCalled();
    });

    it('should revert local plan when backend returns conflict', async () => {
      mockPlanDb.activatePremium.mockResolvedValue(promoPremiumPlan);
      mockPlanDb.deactivatePremium.mockResolvedValue(freePlan);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'PLAN_ALREADY_ACTIVE' }),
      });

      await expect(planSync.syncActivatePremium('PROMO123')).rejects.toThrow(
        'Premium activation failed: PLAN_ALREADY_ACTIVE'
      );
      expect(mockPlanDb.deactivatePremium).toHaveBeenCalled();
    });
  });

  describe('device ID management', () => {
    it('should set and get device ID', () => {
      planSync.setDeviceId('my-device');
      expect(planSync.getDeviceId()).toBe('my-device');
    });
  });
});
