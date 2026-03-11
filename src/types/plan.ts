export type PlanTier = 'free' | 'trial' | 'premium';
export type PremiumSource = 'store' | 'promo';
export type SubscriptionStatus = 'active' | 'cancelled' | 'grace_period' | 'expired';

export interface UserPlan {
  id: string;
  tier: PlanTier;
  trialStartDate: string | null;
  trialEndsDate: string | null;
  premiumActivatedDate: string | null;
  promoCode: string | null;
  premiumSource: PremiumSource | null;
  subscriptionStatus: SubscriptionStatus | null;
  expiresAt: string | null;
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

export interface StoreSubscriptionInfo {
  isActive: boolean;
  willRenew: boolean;
  expirationDate: string | null;
  store: 'app_store' | 'play_store' | null;
  productIdentifier: string | null;
  subscriptionStatus: SubscriptionStatus;
}

export interface PlanStatus {
  tier: PlanTier;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
  canUsePremium: boolean;
  vpsQuotaRemaining: number;
  geminiQuotaRemaining: number;
  storeSubscription: StoreSubscriptionInfo | null;
}
