/**
 * Detects trial→free tier transition and shows expiration notification.
 *
 * The actual expiration check happens in planDatabase.getUserPlan() via
 * checkTrialExpiration(). This hook observes the resulting tier change
 * and triggers a user-facing notification.
 *
 * @see Story 5.4 Task 5
 */

import { useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { useUserPlan } from './usePlan';
import { trackEvent } from '../utils/analytics';
import type { PlanTier } from '../types';

export function useTrialExpiration() {
  const { data: plan } = useUserPlan();
  const previousTierRef = useRef<PlanTier | null>(null);

  useEffect(() => {
    if (!plan) return;

    const previousTier = previousTierRef.current;
    previousTierRef.current = plan.tier;

    // Detect trial → free transition (expiration)
    if (previousTier === 'trial' && plan.tier === 'free') {
      trackEvent('trial_expired', {
        date: new Date().toISOString(),
      });

      Toast.show({
        type: 'info',
        text1: 'Essai Premium termine',
        text2: 'Passez a Premium pour des imports illimites en haute qualite.',
        visibilityTime: 6000,
      });
    }
  }, [plan]);
}
