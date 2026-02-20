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

  const weekUsage = usage?.weekTotal ?? 0;
  const todayGemini = usage?.today.geminiImportsUsed ?? 0;

  let vpsPerWeek: number;
  let geminiPerDay: number;

  switch (plan.tier) {
    case 'premium':
      vpsPerWeek = QUOTA.PREMIUM_VPS_PER_WEEK;
      geminiPerDay = QUOTA.PREMIUM_GEMINI_PER_DAY;
      break;
    case 'trial':
      vpsPerWeek = QUOTA.TRIAL_VPS_PER_WEEK;
      geminiPerDay = QUOTA.TRIAL_GEMINI_PER_DAY;
      break;
    default:
      vpsPerWeek = QUOTA.FREE_VPS_PER_WEEK;
      geminiPerDay = 0;
  }

  return {
    tier: plan.tier,
    trialDaysRemaining: getTrialDaysRemaining(plan),
    isTrialExpired: isTrialExpired(plan),
    canUsePremium: canUsePremiumPipeline(plan),
    vpsQuotaRemaining: Math.max(0, vpsPerWeek - weekUsage),
    geminiQuotaRemaining: Math.max(0, geminiPerDay - todayGemini),
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
      return { today, weekTotal };
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
