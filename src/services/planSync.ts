/**
 * Plan sync service between local SQLite and backend Redis.
 *
 * Mobile SQLite is a local cache for offline display.
 * Backend Redis is the source of truth for tier routing and quota enforcement.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import * as planDb from './planDatabase';
import type { UserPlan } from '../types';

const AI_PIPELINE_URL = process.env.EXPO_PUBLIC_AI_PIPELINE_URL || 'http://localhost:8001';
const DEVICE_ID_KEY = 'MMMH_DEVICE_ID';

let deviceId: string | null = null;

/**
 * Initialize device ID from AsyncStorage, generating one if needed.
 * Must be called once at app startup (after AsyncStorage is ready).
 */
export async function initDeviceId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      deviceId = stored;
      return stored;
    }

    const newId = uuid.v4() as string;
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    deviceId = newId;
    return newId;
  } catch {
    // Fallback: generate in-memory ID (won't persist across restarts)
    if (!deviceId) {
      deviceId = uuid.v4() as string;
    }
    return deviceId;
  }
}

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
    const response = await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trial' }),
    });

    if (!response.ok) {
      // Log but don't revert trial — backend may already have it
    }
  } catch {
    // Network error — backend will sync on next startup
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
    const response = await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'premium', promo_code: promoCode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.detail || `HTTP ${response.status}`;
      // Revert local plan since backend rejected
      await planDb.deactivatePremium();
      throw new Error(`Premium activation failed: ${detail}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Premium activation failed')) {
      throw error;
    }
    // Network error — local is updated, backend will sync on next startup
  }

  return localPlan;
}

/**
 * Ensure local plan state is synced to backend on startup.
 * Handles cases where trial/premium was activated locally but sync to backend failed.
 */
export async function ensurePlanSyncedToBackend(): Promise<void> {
  if (!deviceId) return;

  const localPlan = await planDb.getUserPlan();

  // Nothing to push if user is free tier
  if (localPlan.tier === 'free') return;

  try {
    const response = await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return;

    const data = await response.json();
    const backendTier = data.plan?.tier || 'free';

    // Backend already matches local — nothing to do
    if (backendTier === localPlan.tier) return;

    // Push local state to backend
    if (localPlan.tier === 'trial') {
      const resp = await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trial' }),
      });
      // 409 = already active, which is fine
      if (!resp.ok && resp.status !== 409) return;
    } else if (localPlan.tier === 'premium') {
      const resp = await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'premium', promo_code: localPlan.promoCode || '' }),
      });
      // 409 = already active, which is fine
      if (!resp.ok && resp.status !== 409) return;
    }
  } catch {
    // Silently fail — will retry on next app launch
  }
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
