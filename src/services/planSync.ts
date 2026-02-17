/**
 * Plan sync service between local SQLite and backend Redis.
 *
 * Mobile SQLite is a local cache for offline display.
 * Backend Redis is the source of truth for tier routing and quota enforcement.
 */

import * as planDb from './planDatabase';
import type { UserPlan } from '../types';

const AI_PIPELINE_URL = process.env.EXPO_PUBLIC_AI_PIPELINE_URL || 'http://localhost:8001';

// Device ID should come from a persistent store (e.g., AsyncStorage)
// For now this is a placeholder — Story 5.3+ will wire the real device ID
let deviceId: string | null = null;

export function setDeviceId(id: string): void {
  deviceId = id;
}

export function getDeviceId(): string | null {
  return deviceId;
}

/**
 * Sync plan from backend to local SQLite on app launch.
 * Falls back to local data if backend is unreachable.
 */
export async function syncPlanFromBackend(): Promise<UserPlan> {
  if (!deviceId) {
    return planDb.getUserPlan();
  }

  try {
    const response = await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return planDb.getUserPlan();
    }

    const data = await response.json();
    const backendPlan = data.plan;

    if (!backendPlan || !backendPlan.tier) {
      return planDb.getUserPlan();
    }

    // Update local plan to match backend
    const localPlan = await planDb.getUserPlan();
    if (localPlan.tier !== backendPlan.tier) {
      await updateLocalPlanFromBackend(localPlan, backendPlan);
    }

    return planDb.getUserPlan();
  } catch {
    // Offline fallback: use local plan data
    return planDb.getUserPlan();
  }
}

/**
 * Activate trial on both backend and local.
 */
export async function syncActivateTrial(): Promise<UserPlan> {
  // Activate locally first for immediate UX
  const localPlan = await planDb.activateTrial();

  if (!deviceId) return localPlan;

  try {
    await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trial' }),
    });
  } catch {
    // Backend sync failed — local is already updated
  }

  return localPlan;
}

/**
 * Activate premium on both backend and local.
 */
export async function syncActivatePremium(promoCode: string): Promise<UserPlan> {
  const localPlan = await planDb.activatePremium(promoCode);

  if (!deviceId) return localPlan;

  try {
    await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'premium', promo_code: promoCode }),
    });
  } catch {
    // Backend sync failed — local is already updated
  }

  return localPlan;
}

// --- Internal helpers ---

async function updateLocalPlanFromBackend(
  localPlan: UserPlan,
  backendPlan: Record<string, string>
): Promise<void> {
  const tier = backendPlan.tier;

  if (tier === 'premium' && localPlan.tier !== 'premium') {
    await planDb.activatePremium(backendPlan.promo_code || '');
  } else if (tier === 'trial' && localPlan.tier !== 'trial') {
    // Only if trial not already used locally
    if (localPlan.trialStartDate === null) {
      await planDb.activateTrial();
    }
  } else if (tier === 'free' && localPlan.tier !== 'free') {
    if (localPlan.tier === 'premium') {
      await planDb.deactivatePremium();
    }
    // Trial expiration is handled automatically by getUserPlan()
  }
}
