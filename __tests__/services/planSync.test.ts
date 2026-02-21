jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('../../src/services/planDatabase');

import * as planSync from '../../src/services/planSync';
import * as planDb from '../../src/services/planDatabase';
import type { UserPlan } from '../../src/types';

const mockPlanDb = planDb as jest.Mocked<typeof planDb>;

const freePlan: UserPlan = {
  id: 'plan-1',
  tier: 'free',
  trialStartDate: null,
  trialEndsDate: null,
  premiumActivatedDate: null,
  promoCode: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const trialPlan: UserPlan = {
  ...freePlan,
  tier: 'trial',
  trialStartDate: '2026-02-16T00:00:00.000Z',
  trialEndsDate: '2026-02-23T00:00:00.000Z',
};

const premiumPlan: UserPlan = {
  ...freePlan,
  tier: 'premium',
  premiumActivatedDate: '2026-02-16T00:00:00.000Z',
  promoCode: 'PROMO123',
};

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Plan Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    planSync.setDeviceId('test-device-123');
  });

  describe('syncPlanFromBackend', () => {
    it('should fetch plan from backend and return local plan', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: { tier: 'free' } }),
      });
      mockPlanDb.getUserPlan.mockResolvedValue(freePlan);

      const result = await planSync.syncPlanFromBackend();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(freePlan);
    });

    it('should fall back to local plan when backend is unreachable', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      mockPlanDb.getUserPlan.mockResolvedValue(freePlan);

      const result = await planSync.syncPlanFromBackend();

      expect(result).toEqual(freePlan);
    });

    it('should fall back to local plan when backend returns error', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });
      mockPlanDb.getUserPlan.mockResolvedValue(freePlan);

      const result = await planSync.syncPlanFromBackend();

      expect(result).toEqual(freePlan);
    });

    it('should update local plan when backend tier differs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: { tier: 'premium', promo_code: 'ABC' } }),
      });
      // First call: getUserPlan for check, second: after update
      mockPlanDb.getUserPlan.mockResolvedValueOnce(freePlan).mockResolvedValueOnce(premiumPlan);
      mockPlanDb.activatePremium.mockResolvedValue(premiumPlan);

      const result = await planSync.syncPlanFromBackend();

      expect(mockPlanDb.activatePremium).toHaveBeenCalledWith('ABC');
      expect(result).toEqual(premiumPlan);
    });

    it('should use local plan when no device ID set', async () => {
      planSync.setDeviceId(null as unknown as string);
      // Reset to null to test no-device path
      // The function checks for falsy deviceId
      mockPlanDb.getUserPlan.mockResolvedValue(freePlan);

      // We need a way to clear deviceId — let's set it to empty
      planSync.setDeviceId('');

      const result = await planSync.syncPlanFromBackend();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual(freePlan);
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
      mockPlanDb.activatePremium.mockResolvedValue(premiumPlan);
      mockFetch.mockResolvedValue({ ok: true });

      const result = await planSync.syncActivatePremium('PROMO123');

      expect(result).toEqual(premiumPlan);
      expect(mockPlanDb.activatePremium).toHaveBeenCalledWith('PROMO123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/plan/test-device-123/activate'),
        expect.objectContaining({
          body: JSON.stringify({ action: 'premium', promo_code: 'PROMO123' }),
        })
      );
    });

    it('should return local plan even if backend sync fails (network error)', async () => {
      mockPlanDb.activatePremium.mockResolvedValue(premiumPlan);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await planSync.syncActivatePremium('PROMO123');

      expect(result).toEqual(premiumPlan);
    });

    it('should revert local plan and throw when backend rejects promo code', async () => {
      mockPlanDb.activatePremium.mockResolvedValue(premiumPlan);
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
      mockPlanDb.activatePremium.mockResolvedValue(premiumPlan);
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
