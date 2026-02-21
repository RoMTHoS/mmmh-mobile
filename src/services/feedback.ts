/**
 * Feedback submission service via EmailJS REST API.
 *
 * Sends user feedback (bug reports, feature requests, general)
 * directly to the team email without a backend endpoint.
 *
 * @see Story 6.2
 */

import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { getDeviceId } from './planSync';
import { getDatabase } from './database';
import * as planDb from './planDatabase';

const EMAILJS_SERVICE_ID =
  Constants.expoConfig?.extra?.emailjsServiceId || process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID =
  Constants.expoConfig?.extra?.emailjsTemplateId ||
  process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID ||
  '';
const EMAILJS_PUBLIC_KEY =
  Constants.expoConfig?.extra?.emailjsPublicKey || process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '';

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';

export type FeedbackType = 'bug' | 'feature' | 'general';

export interface FeedbackContext {
  appVersion: string;
  device: string;
  os: string;
  planTier: string;
  recipesCount: number;
  importsCount: number;
  deviceId: string;
}

export interface FeedbackPayload {
  type: FeedbackType;
  message: string;
  screenshotBase64?: string;
  context: FeedbackContext;
}

/**
 * Gather automatic context about the app and device.
 */
export async function gatherContext(): Promise<FeedbackContext> {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const device = `${Platform.OS} ${Platform.Version}`;
  const os = Platform.OS;

  let planTier = 'free';
  let recipesCount = 0;
  let importsCount = 0;

  try {
    const plan = await planDb.getUserPlan();
    if (plan) planTier = plan.tier;
  } catch {
    // SQLite may not be ready
  }

  try {
    const db = getDatabase();
    const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM recipes');
    if (row) recipesCount = row.count;
  } catch {
    // Ignore
  }

  try {
    const db = getDatabase();
    const row = db.getFirstSync<{ total: number }>(
      'SELECT COALESCE(SUM(vps_imports_used + gemini_imports_used), 0) as total FROM import_usage'
    );
    if (row) importsCount = row.total;
  } catch {
    // Ignore
  }

  return {
    appVersion,
    device,
    os,
    planTier,
    recipesCount,
    importsCount,
    deviceId: getDeviceId() ?? 'unknown',
  };
}

/**
 * Encode an image file as base64.
 */
export async function encodeScreenshot(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Submit feedback via EmailJS REST API.
 *
 * @throws Error if submission fails
 */
export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const typeLabels: Record<FeedbackType, string> = {
    bug: 'Bug Report',
    feature: 'Feature Request',
    general: 'General Feedback',
  };

  const templateParams: Record<string, string | number> = {
    feedback_type: typeLabels[payload.type],
    message: payload.message,
    app_version: payload.context.appVersion,
    device: payload.context.device,
    os: payload.context.os,
    plan_tier: payload.context.planTier,
    recipes_count: payload.context.recipesCount,
    imports_count: payload.context.importsCount,
    device_id: payload.context.deviceId,
  };

  if (payload.screenshotBase64) {
    templateParams.screenshot = `data:image/jpeg;base64,${payload.screenshotBase64}`;
  }

  const response = await fetch(EMAILJS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    throw new Error(`Feedback submission failed: ${response.status}`);
  }
}
