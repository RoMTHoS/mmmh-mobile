import type { UserPlan } from '../types';

export function isTrialExpired(plan: UserPlan): boolean {
  if (!plan.trialEndsDate) return false;
  return new Date() > new Date(plan.trialEndsDate);
}

export function canActivateTrial(plan: UserPlan): boolean {
  return plan.trialStartDate === null;
}

export function canUsePremiumPipeline(plan: UserPlan): boolean {
  if (plan.tier === 'premium') return true;
  if (plan.tier === 'trial' && !isTrialExpired(plan)) return true;
  return false;
}

export function getTrialDaysRemaining(plan: UserPlan): number | null {
  if (plan.tier !== 'trial' || !plan.trialEndsDate) return null;

  const now = new Date();
  const ends = new Date(plan.trialEndsDate);
  const diffMs = ends.getTime() - now.getTime();

  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function validateTransition(
  currentTier: UserPlan['tier'],
  targetTier: UserPlan['tier'],
  plan: UserPlan
): void {
  if (currentTier === 'trial' && targetTier === 'trial') {
    throw new Error("Impossible de réactiver l'essai gratuit.");
  }
  if (currentTier === 'premium' && targetTier === 'trial') {
    throw new Error("Impossible de passer du premium à l'essai.");
  }
  if (targetTier === 'trial' && !canActivateTrial(plan)) {
    throw new Error("L'essai gratuit a déjà été utilisé.");
  }
}
