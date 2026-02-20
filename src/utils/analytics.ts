/**
 * Typed analytics event tracking.
 *
 * Delegates to the Mixpanel analytics service. Maintains typed event
 * signatures for existing call sites from Epic 5.
 *
 * @see Story 5.4 Task 6, Story 5.5 Task 9, Story 6.1
 */

import { analytics } from '../services/analytics';

type TrialEvent = 'trial_started' | 'trial_import_used' | 'trial_expired' | 'trial_converted';

type QuotaEvent =
  | 'quota_exhausted_vps'
  | 'quota_exhausted_gemini'
  | 'fallback_accepted'
  | 'fallback_declined';

type PremiumEvent = 'premium_activated';

type AnalyticsEvent = TrialEvent | QuotaEvent | PremiumEvent;

interface TrialStartedParams {
  date: string;
}

interface TrialImportUsedParams {
  dayNumber: number;
  importType: string;
}

interface TrialExpiredParams {
  date: string;
  totalImportsUsed?: number;
}

interface TrialConvertedParams {
  dayNumber?: number;
  totalImportsUsed?: number;
}

interface QuotaExhaustedVpsParams {
  deviceId: string;
  tier: string;
}

interface QuotaExhaustedGeminiParams {
  deviceId: string;
  dayOfTrial: number;
}

// fallback_accepted and fallback_declined have no required params
type FallbackParams = Record<string, never>;

interface PremiumActivatedParams {
  deviceId: string;
  promoCode: string;
  previousTier: string;
}

type EventParams = {
  trial_started: TrialStartedParams;
  trial_import_used: TrialImportUsedParams;
  trial_expired: TrialExpiredParams;
  trial_converted: TrialConvertedParams;
  quota_exhausted_vps: QuotaExhaustedVpsParams;
  quota_exhausted_gemini: QuotaExhaustedGeminiParams;
  fallback_accepted: FallbackParams;
  fallback_declined: FallbackParams;
  premium_activated: PremiumActivatedParams;
};

export function trackEvent<E extends AnalyticsEvent>(event: E, params: EventParams[E]): void {
  analytics.track(event, params as Record<string, unknown>);
}
