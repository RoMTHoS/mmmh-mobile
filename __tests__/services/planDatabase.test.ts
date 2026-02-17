jest.mock('expo-sqlite');
jest.mock('react-native-uuid');

import * as planDb from '../../src/services/planDatabase';
import { resetDatabase } from '../../src/services/database';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SQLiteMock = require('../../__mocks__/expo-sqlite');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const uuidMock = require('../../__mocks__/react-native-uuid');

const mockDatabase = SQLiteMock.__mockDatabase;

describe('Plan Database Service', () => {
  beforeEach(() => {
    SQLiteMock.__resetMocks();
    uuidMock.__resetCounter();
    resetDatabase();
  });

  describe('getWeekStartDate', () => {
    it('returns Monday for a Wednesday', () => {
      // 2026-02-11 is a Wednesday
      const date = new Date('2026-02-11T12:00:00.000Z');
      expect(planDb.getWeekStartDate(date)).toBe('2026-02-09');
    });

    it('returns Monday for a Monday', () => {
      // 2026-02-09 is a Monday
      const date = new Date('2026-02-09T12:00:00.000Z');
      expect(planDb.getWeekStartDate(date)).toBe('2026-02-09');
    });

    it('returns Monday for a Sunday', () => {
      // 2026-02-15 is a Sunday
      const date = new Date('2026-02-15T12:00:00.000Z');
      expect(planDb.getWeekStartDate(date)).toBe('2026-02-09');
    });
  });

  describe('getUserPlan', () => {
    it('returns existing plan row', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'plan-1',
        tier: 'free',
        trial_start_date: null,
        trial_ends_date: null,
        premium_activated_date: null,
        promo_code: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      const plan = await planDb.getUserPlan();
      expect(plan.id).toBe('plan-1');
      expect(plan.tier).toBe('free');
      expect(mockDatabase.getFirstSync).toHaveBeenCalledWith('SELECT * FROM user_plan LIMIT 1');
    });

    it('auto-creates free plan when none exists', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      const plan = await planDb.getUserPlan();
      expect(plan.id).toBe('test-uuid-1');
      expect(plan.tier).toBe('free');
      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      expect(mockDatabase.runSync.mock.calls[0][0]).toContain('INSERT INTO user_plan');
    });

    it('auto-expires trial when past end date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockDatabase.getFirstSync.mockReturnValue({
        id: 'plan-1',
        tier: 'trial',
        trial_start_date: '2026-01-01T00:00:00.000Z',
        trial_ends_date: yesterday.toISOString(),
        premium_activated_date: null,
        promo_code: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      const plan = await planDb.getUserPlan();
      expect(plan.tier).toBe('free');
      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      expect(mockDatabase.runSync.mock.calls[0][0]).toContain("SET tier = 'free'");
    });
  });

  describe('activateTrial', () => {
    it('activates trial for free user', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'plan-1',
        tier: 'free',
        trial_start_date: null,
        trial_ends_date: null,
        premium_activated_date: null,
        promo_code: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      const plan = await planDb.activateTrial();
      expect(plan.tier).toBe('trial');
      expect(plan.trialStartDate).toBeTruthy();
      expect(plan.trialEndsDate).toBeTruthy();

      const updateCall = mockDatabase.runSync.mock.calls[0];
      expect(updateCall[0]).toContain("tier = 'trial'");
    });

    it('throws when trial already used', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'plan-1',
        tier: 'free',
        trial_start_date: '2026-01-01T00:00:00.000Z',
        trial_ends_date: '2026-01-08T00:00:00.000Z',
        premium_activated_date: null,
        promo_code: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      await expect(planDb.activateTrial()).rejects.toThrow('essai gratuit a déjà été utilisé');
    });
  });

  describe('activatePremium', () => {
    it('activates premium with promo code', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'plan-1',
        tier: 'free',
        trial_start_date: null,
        trial_ends_date: null,
        premium_activated_date: null,
        promo_code: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      const plan = await planDb.activatePremium('PROMO123');
      expect(plan.tier).toBe('premium');
      expect(plan.promoCode).toBe('PROMO123');
      expect(plan.premiumActivatedDate).toBeTruthy();
    });
  });

  describe('deactivatePremium', () => {
    it('deactivates premium back to free', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'plan-1',
        tier: 'premium',
        trial_start_date: null,
        trial_ends_date: null,
        premium_activated_date: '2026-01-01T00:00:00.000Z',
        promo_code: 'PROMO123',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      const plan = await planDb.deactivatePremium();
      expect(plan.tier).toBe('free');
      expect(plan.premiumActivatedDate).toBeNull();
    });
  });

  describe('getTodayUsage', () => {
    it('returns existing usage row', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'usage-1',
        usage_date: '2026-02-16',
        vps_imports_used: 3,
        gemini_imports_used: 1,
        week_start_date: '2026-02-16',
        created_at: '2026-02-16T00:00:00.000Z',
      });

      const usage = await planDb.getTodayUsage();
      expect(usage.vpsImportsUsed).toBe(3);
      expect(usage.geminiImportsUsed).toBe(1);
    });

    it('auto-creates usage row when none exists', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      const usage = await planDb.getTodayUsage();
      expect(usage.id).toBe('test-uuid-1');
      expect(usage.vpsImportsUsed).toBe(0);
      expect(usage.geminiImportsUsed).toBe(0);
      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      expect(mockDatabase.runSync.mock.calls[0][0]).toContain('INSERT INTO import_usage');
    });
  });

  describe('getWeekUsage', () => {
    it('returns sum of VPS imports for current week', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ total: 7 });

      const total = await planDb.getWeekUsage();
      expect(total).toBe(7);
      expect(mockDatabase.getFirstSync.mock.calls[0][0]).toContain('SUM(vps_imports_used)');
    });

    it('returns 0 when no usage', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ total: 0 });

      const total = await planDb.getWeekUsage();
      expect(total).toBe(0);
    });
  });

  describe('incrementVpsUsage', () => {
    it('increments VPS counter', async () => {
      // First call: getTodayUsage -> getFirstSync
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'usage-1',
        usage_date: '2026-02-16',
        vps_imports_used: 3,
        gemini_imports_used: 0,
        week_start_date: '2026-02-16',
        created_at: '2026-02-16T00:00:00.000Z',
      });

      await planDb.incrementVpsUsage();

      const updateCall = mockDatabase.runSync.mock.calls[0];
      expect(updateCall[0]).toContain('vps_imports_used = vps_imports_used + 1');
      expect(updateCall[1]).toEqual(['usage-1']);
    });
  });

  describe('incrementGeminiUsage', () => {
    it('increments Gemini counter', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'usage-1',
        usage_date: '2026-02-16',
        vps_imports_used: 0,
        gemini_imports_used: 0,
        week_start_date: '2026-02-16',
        created_at: '2026-02-16T00:00:00.000Z',
      });

      await planDb.incrementGeminiUsage();

      const updateCall = mockDatabase.runSync.mock.calls[0];
      expect(updateCall[0]).toContain('gemini_imports_used = gemini_imports_used + 1');
      expect(updateCall[1]).toEqual(['usage-1']);
    });
  });
});
