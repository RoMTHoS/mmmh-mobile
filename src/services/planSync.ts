/**
 * Plan sync service between local SQLite, RevenueCat, and backend Redis.
 *
 * Sync priority chain:
 * 1. RevenueCat SDK → if premium entitlement active → tier = premium (store)
 * 2. Backend Redis → handles trial/free/promo-premium
 * 3. Local SQLite cache → offline fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import * as planDb from './planDatabase';
import { getCustomerInfo, isPremiumActive, getSubscriptionStatus } from './revenueCat';
import type { CustomerInfo } from 'react-native-purchases';
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
 * Sync plan using priority chain:
 * 1. RevenueCat SDK (store subscriptions)
 * 2. Backend (trial/free/promo)
 * 3. Local SQLite (offline fallback)
 */
export async function syncPlan(): Promise<UserPlan> {
  // Step 1: Check RevenueCat for store subscriptions
  const customerInfo = await getCustomerInfo();
  if (customerInfo && isPremiumActive(customerInfo)) {
    const subStatus = getSubscriptionStatus(customerInfo);
    await planDb.activateStorePremium(subStatus.subscriptionStatus, subStatus.expirationDate);
    return planDb.getUserPlan();
  }

  // Step 2: If no RC entitlement, check promo protection before downgrading
  if (customerInfo) {
    // RC is reachable but no entitlement — check if user has promo premium
    const localPlan = await planDb.getUserPlan();
    if (localPlan.tier === 'premium' && localPlan.premiumSource === 'store') {
      // Store subscription expired — downgrade
      await planDb.deactivatePremium();
    }
    // If premiumSource === 'promo' or null, keep current tier
  }

  // Step 3: Fetch from backend for trial/free/promo status
  return syncFromBackend();
}

/**
 * Kept for backward compatibility — renamed from syncPlanFromBackend.
 */
export { syncPlan as syncPlanFromBackend };

/**
 * Sync plan from backend to local SQLite.
 * Falls back to local data if backend is unreachable.
 */
async function syncFromBackend(): Promise<UserPlan> {
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
 * Activate premium via promo code on both backend and local.
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
 * Called when RevenueCat confirms a store purchase.
 * Updates local SQLite and notifies backend.
 */
export async function syncActivateFromStore(customerInfo: CustomerInfo): Promise<UserPlan> {
  const subStatus = getSubscriptionStatus(customerInfo);

  const plan = await planDb.activateStorePremium(
    subStatus.subscriptionStatus,
    subStatus.expirationDate
  );

  // Notify backend (best-effort)
  if (deviceId) {
    try {
      await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'premium', source: 'store' }),
      });
    } catch {
      // Backend will be updated by RevenueCat webhook (Story 7.3)
    }
  }

  return plan;
}

/**
 * Callback for RevenueCat customer info listener.
 * Updates local SQLite when entitlement status changes.
 */
export async function handleCustomerInfoUpdate(customerInfo: CustomerInfo): Promise<void> {
  const localPlan = await planDb.getUserPlan();

  if (isPremiumActive(customerInfo)) {
    if (localPlan.tier !== 'premium' || localPlan.premiumSource !== 'store') {
      await syncActivateFromStore(customerInfo);
    }
  } else {
    // No RC entitlement — only downgrade if source was store
    if (localPlan.tier === 'premium' && localPlan.premiumSource === 'store') {
      await planDb.deactivatePremium();
    }
  }
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
      const source = localPlan.premiumSource === 'store' ? 'store' : undefined;
      const resp = await fetch(`${AI_PIPELINE_URL}/plan/${deviceId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'premium',
          promo_code: localPlan.promoCode || '',
          ...(source && { source }),
        }),
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
    if (backendPlan.premium_source === 'store') {
      await planDb.activateStorePremium(
        backendPlan.subscription_status || 'active',
        backendPlan.expires_at || null
      );
    } else {
      await planDb.activatePremium(backendPlan.promo_code || '');
    }
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
