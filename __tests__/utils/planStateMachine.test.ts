import {
  isTrialExpired,
  canActivateTrial,
  canUsePremiumPipeline,
  getTrialDaysRemaining,
  validateTransition,
} from '../../src/utils/planStateMachine';
import type { UserPlan } from '../../src/types';

function makePlan(overrides: Partial<UserPlan> = {}): UserPlan {
  return {
    id: 'plan-1',
    tier: 'free',
    trialStartDate: null,
    trialEndsDate: null,
    premiumActivatedDate: null,
    promoCode: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('planStateMachine', () => {
  describe('isTrialExpired', () => {
    it('returns false when no trial end date', () => {
      const plan = makePlan();
      expect(isTrialExpired(plan)).toBe(false);
    });

    it('returns true when trial has expired', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const plan = makePlan({ trialEndsDate: yesterday.toISOString() });
      expect(isTrialExpired(plan)).toBe(true);
    });

    it('returns false when trial is still active', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const plan = makePlan({ trialEndsDate: tomorrow.toISOString() });
      expect(isTrialExpired(plan)).toBe(false);
    });

    it('returns true when trial expires exactly now (past)', () => {
      const justPast = new Date(Date.now() - 1000);
      const plan = makePlan({ trialEndsDate: justPast.toISOString() });
      expect(isTrialExpired(plan)).toBe(true);
    });
  });

  describe('canActivateTrial', () => {
    it('returns true when never trialed (trialStartDate is null)', () => {
      const plan = makePlan();
      expect(canActivateTrial(plan)).toBe(true);
    });

    it('returns false when trial was previously activated', () => {
      const plan = makePlan({ trialStartDate: '2026-01-01T00:00:00.000Z' });
      expect(canActivateTrial(plan)).toBe(false);
    });
  });

  describe('canUsePremiumPipeline', () => {
    it('returns false for free tier', () => {
      const plan = makePlan();
      expect(canUsePremiumPipeline(plan)).toBe(false);
    });

    it('returns true for premium tier', () => {
      const plan = makePlan({ tier: 'premium' });
      expect(canUsePremiumPipeline(plan)).toBe(true);
    });

    it('returns true for active trial', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const plan = makePlan({
        tier: 'trial',
        trialEndsDate: tomorrow.toISOString(),
      });
      expect(canUsePremiumPipeline(plan)).toBe(true);
    });

    it('returns false for expired trial', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const plan = makePlan({
        tier: 'trial',
        trialEndsDate: yesterday.toISOString(),
      });
      expect(canUsePremiumPipeline(plan)).toBe(false);
    });
  });

  describe('getTrialDaysRemaining', () => {
    it('returns null for free tier', () => {
      const plan = makePlan();
      expect(getTrialDaysRemaining(plan)).toBeNull();
    });

    it('returns null for premium tier', () => {
      const plan = makePlan({ tier: 'premium' });
      expect(getTrialDaysRemaining(plan)).toBeNull();
    });

    it('returns days remaining for active trial', () => {
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      const plan = makePlan({
        tier: 'trial',
        trialEndsDate: inThreeDays.toISOString(),
      });
      const remaining = getTrialDaysRemaining(plan);
      expect(remaining).toBe(3);
    });

    it('returns 0 for expired trial', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const plan = makePlan({
        tier: 'trial',
        trialEndsDate: yesterday.toISOString(),
      });
      expect(getTrialDaysRemaining(plan)).toBe(0);
    });

    it('returns null when trial tier but no end date', () => {
      const plan = makePlan({ tier: 'trial' });
      expect(getTrialDaysRemaining(plan)).toBeNull();
    });
  });

  describe('validateTransition', () => {
    it('allows free -> trial (never trialed)', () => {
      const plan = makePlan();
      expect(() => validateTransition('free', 'trial', plan)).not.toThrow();
    });

    it('allows free -> premium', () => {
      const plan = makePlan();
      expect(() => validateTransition('free', 'premium', plan)).not.toThrow();
    });

    it('allows trial -> free', () => {
      const plan = makePlan({ tier: 'trial', trialStartDate: '2026-01-01T00:00:00.000Z' });
      expect(() => validateTransition('trial', 'free', plan)).not.toThrow();
    });

    it('allows trial -> premium', () => {
      const plan = makePlan({ tier: 'trial', trialStartDate: '2026-01-01T00:00:00.000Z' });
      expect(() => validateTransition('trial', 'premium', plan)).not.toThrow();
    });

    it('allows premium -> free', () => {
      const plan = makePlan({ tier: 'premium' });
      expect(() => validateTransition('premium', 'free', plan)).not.toThrow();
    });

    it('rejects trial -> trial (cannot re-activate)', () => {
      const plan = makePlan({ tier: 'trial', trialStartDate: '2026-01-01T00:00:00.000Z' });
      expect(() => validateTransition('trial', 'trial', plan)).toThrow(
        "Impossible de réactiver l'essai gratuit."
      );
    });

    it('rejects premium -> trial', () => {
      const plan = makePlan({ tier: 'premium' });
      expect(() => validateTransition('premium', 'trial', plan)).toThrow(
        "Impossible de passer du premium à l'essai."
      );
    });

    it('rejects free -> trial when trial already used', () => {
      const plan = makePlan({ trialStartDate: '2026-01-01T00:00:00.000Z' });
      expect(() => validateTransition('free', 'trial', plan)).toThrow(
        "L'essai gratuit a déjà été utilisé."
      );
    });
  });
});
