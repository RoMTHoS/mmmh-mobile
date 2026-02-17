/**
 * Lightweight analytics event tracking.
 *
 * For beta: events are logged to console. Full analytics integration
 * (e.g., PostHog, Mixpanel) deferred to post-beta.
 *
 * @see Story 5.4 Task 6
 */

type TrialEvent = 'trial_started' | 'trial_import_used' | 'trial_expired' | 'trial_converted';

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

type EventParams = {
  trial_started: TrialStartedParams;
  trial_import_used: TrialImportUsedParams;
  trial_expired: TrialExpiredParams;
  trial_converted: TrialConvertedParams;
};

export function trackEvent<E extends TrialEvent>(event: E, params: EventParams[E]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, params);
  }
}
