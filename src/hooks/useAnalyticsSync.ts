/**
 * Hook that syncs user properties to Mixpanel when they change.
 *
 * Sets device metadata once on init and updates recipe count,
 * import count, and plan tier as they change.
 *
 * @see Story 6.1 Task 5
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { analytics } from '../services/analytics';
import { useRecipes } from './useRecipes';
import { useUserPlan } from './usePlan';

export function useAnalyticsSync() {
  const hasSetStaticProps = useRef(false);
  const { data: recipes } = useRecipes();
  const { data: plan } = useUserPlan();

  // Set static properties once
  useEffect(() => {
    if (hasSetStaticProps.current) return;
    hasSetStaticProps.current = true;

    analytics.setUserProperties({
      device_type: Platform.OS,
      os_version: Platform.Version?.toString() ?? 'unknown',
      app_version: Constants.expoConfig?.version ?? '1.0.0',
    });
  }, []);

  // Update recipe count when it changes
  useEffect(() => {
    if (recipes === undefined) return;
    analytics.setUserProperties({ recipes_count: recipes.length });
  }, [recipes?.length]);

  // Update plan tier when it changes
  useEffect(() => {
    if (!plan) return;
    analytics.setUserProperties({ plan_tier: plan.tier });
  }, [plan?.tier]);
}
