export type PlanTier = 'free' | 'trial' | 'premium';

export interface UserPlan {
  id: string;
  tier: PlanTier;
  trialStartDate: string | null;
  trialEndsDate: string | null;
  premiumActivatedDate: string | null;
  promoCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportUsage {
  id: string;
  date: string;
  vpsImportsUsed: number;
  geminiImportsUsed: number;
  weekStartDate: string;
  createdAt: string;
}

export interface PlanStatus {
  tier: PlanTier;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
  canUsePremium: boolean;
  vpsQuotaRemaining: number;
  geminiQuotaRemaining: number;
}
