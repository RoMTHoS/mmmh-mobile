/**
 * Analytics service — Mixpanel HTTP API wrapper.
 *
 * Uses Mixpanel's HTTP Track API directly instead of the native SDK,
 * for reliable cross-platform event delivery.
 *
 * All calls are no-ops when analytics is disabled (GDPR opt-out).
 * No PII is ever collected — only anonymous device UUID, app metadata,
 * and usage statistics.
 *
 * @see Story 6.1
 */

import Constants from 'expo-constants';

const MIXPANEL_TOKEN =
  Constants.expoConfig?.extra?.mixpanelToken || process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '';

const ANALYTICS_ENABLED =
  (Constants.expoConfig?.extra?.analyticsEnabled ?? process.env.EXPO_PUBLIC_ANALYTICS_ENABLED) !==
  'false';

const MIXPANEL_API = 'https://api-eu.mixpanel.com';

let isEnabled = false;
let distinctId = '';

/**
 * Send an event to Mixpanel via the HTTP Track API.
 */
async function sendEvent(event: string, properties?: Record<string, unknown>): Promise<void> {
  const payload = {
    event,
    properties: {
      token: MIXPANEL_TOKEN,
      distinct_id: distinctId || 'anonymous',
      time: Math.floor(Date.now() / 1000),
      ...properties,
    },
  };

  try {
    const data = btoa(JSON.stringify(payload));
    await fetch(`${MIXPANEL_API}/track?data=${data}`);
  } catch {
    // Silently fail — analytics should never break the app
  }
}

/**
 * Send user profile properties via the Engage API.
 */
async function sendProfileUpdate(props: Record<string, unknown>): Promise<void> {
  const payload = {
    $token: MIXPANEL_TOKEN,
    $distinct_id: distinctId || 'anonymous',
    $set: props,
  };

  try {
    const data = btoa(JSON.stringify(payload));
    await fetch(`${MIXPANEL_API}/engage?data=${data}`);
  } catch {
    // Silently fail
  }
}

/**
 * Initialize analytics. No-op if disabled or no token.
 */
async function initialize(): Promise<void> {
  if (!ANALYTICS_ENABLED || !MIXPANEL_TOKEN) {
    isEnabled = false;
    return;
  }
  isEnabled = true;
}

/**
 * Track an analytics event. No-op if analytics is disabled.
 */
function track(event: string, properties?: Record<string, unknown>): void {
  if (!isEnabled) return;
  sendEvent(event, properties);
}

/**
 * Set the user identity (anonymous device UUID — no PII).
 */
function identify(deviceId: string): void {
  distinctId = deviceId;
}

/**
 * Set user profile properties (people properties in Mixpanel).
 */
function setUserProperties(props: Record<string, unknown>): void {
  if (!isEnabled) return;
  sendProfileUpdate(props);
}

/**
 * Reset analytics state (e.g., on data clear).
 */
function reset(): void {
  distinctId = '';
}

/**
 * Check if analytics is currently enabled and initialized.
 */
function getIsEnabled(): boolean {
  return isEnabled;
}

export const analytics = {
  initialize,
  track,
  identify,
  setUserProperties,
  reset,
  getIsEnabled,
};
