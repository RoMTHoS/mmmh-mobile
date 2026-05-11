import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as planDb from '../services/planDatabase';
import { syncActivateTrial, syncActivatePremium } from '../services/planSync';
import { analytics } from '../services/analytics';
import { EVENTS } from '../utils/analyticsEvents';
import {
  canUsePremiumPipeline,
  getTrialDaysRemaining,
  isTrialExpired,
} from '../utils/planStateMachine';
import { QUOTA } from '../utils/planConstants';
import type { PlanStatus } from '../types';

const USER_PLAN_KEY = ['user-plan'];
const IMPORT_USAGE_KEY = ['import-usage'];

export function useUserPlan() {
  return useQuery({
    queryKey: USER_PLAN_KEY,
    queryFn: () => planDb.getUserPlan(),
  });
}

export function usePlanStatus(): PlanStatus | null {
  const { data: plan } = useUserPlan();
  const { data: usage } = useImportUsage();

  if (!plan) return null;

  const weekVpsUsage = usage?.weekTotal ?? 0;
  const weekGeminiUsage = usage?.weekGeminiTotal ?? 0;

  let vpsPerWeek: number;
  let geminiPerWeek: number;

  switch (plan.tier) {
    case 'premium':
      vpsPerWeek = QUOTA.PREMIUM_VPS_PER_WEEK;
      geminiPerWeek = QUOTA.PREMIUM_GEMINI_PER_WEEK;
      break;
    case 'trial':
      vpsPerWeek = QUOTA.TRIAL_VPS_PER_WEEK;
      geminiPerWeek = QUOTA.TRIAL_GEMINI_PER_WEEK;
      break;
    default:
      vpsPerWeek = QUOTA.FREE_VPS_PER_WEEK;
      geminiPerWeek = QUOTA.FREE_GEMINI_PER_WEEK;
  }

  const storeSubscription =
    plan.premiumSource === 'store' && plan.subscriptionStatus
      ? {
          isActive: plan.tier === 'premium',
          willRenew: plan.subscriptionStatus === 'active',
          expirationDate: plan.expiresAt ?? null,
          store: null as 'app_store' | 'play_store' | null,
          productIdentifier: null as string | null,
          subscriptionStatus: plan.subscriptionStatus,
        }
      : null;

  return {
    tier: plan.tier,
    trialDaysRemaining: getTrialDaysRemaining(plan),
    isTrialExpired: isTrialExpired(plan),
    canUsePremium: canUsePremiumPipeline(plan),
    vpsQuotaRemaining: Math.max(0, vpsPerWeek - weekVpsUsage),
    geminiQuotaRemaining: Math.max(0, geminiPerWeek - weekGeminiUsage),
    storeSubscription,
  };
}

export function useActivateTrial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncActivateTrial(),
    onSuccess: () => {
      analytics.track(EVENTS.TRIAL_STARTED);
      queryClient.invalidateQueries({ queryKey: USER_PLAN_KEY });
    },
  });
}

export function useActivatePremium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promoCode: string) => syncActivatePremium(promoCode),
    onSuccess: () => {
      analytics.track(EVENTS.PLAN_UPGRADED, { tier: 'premium' });
      queryClient.invalidateQueries({ queryKey: USER_PLAN_KEY });
    },
  });
}

export function useImportUsage() {
  return useQuery({
    queryKey: IMPORT_USAGE_KEY,
    queryFn: async () => {
      const today = await planDb.getTodayUsage();
      const weekTotal = await planDb.getWeekUsage();
      const weekGeminiTotal = await planDb.getWeekGeminiUsage();
      return { today, weekTotal, weekGeminiTotal };
    },
  });
}

export function useIncrementUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pipeline: 'vps' | 'gemini') => {
      if (pipeline === 'vps') {
        await planDb.incrementVpsUsage();
      } else {
        await planDb.incrementGeminiUsage();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_USAGE_KEY });
    },
  });
}
