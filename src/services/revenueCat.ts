/**
 * RevenueCat SDK integration for subscription management.
 *
 * Wraps react-native-purchases to provide entitlement checking,
 * customer info listening, and subscription status extraction.
 */

import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import type { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import type { StoreSubscriptionInfo, SubscriptionStatus } from '../types';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  userCancelled?: boolean;
}

export interface RestoreResult {
  restored: boolean;
  customerInfo?: CustomerInfo;
}

export const REVENUECAT_ENTITLEMENT_ID = 'premium';

let isInitialized = false;

/**
 * Initialize RevenueCat SDK with platform-specific API key.
 * Must be called once at app startup after device ID is available.
 */
export async function initRevenueCat(deviceId: string): Promise<void> {
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || ''
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

  if (!apiKey) {
    // No API key configured — skip initialization (dev/testing)
    return;
  }

  try {
    Purchases.configure({ apiKey, appUserID: deviceId });
    isInitialized = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Log but don't throw — app should continue in degraded mode
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`RevenueCat init failed: ${message}`);
    }
  }
}

/**
 * Get current customer info from RevenueCat.
 * Returns null if SDK is not initialized or call fails.
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isInitialized) return null;

  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

/**
 * Check if premium entitlement is currently active.
 */
export function isPremiumActive(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined;
}

/**
 * Extract structured subscription status from customer info.
 */
export function getSubscriptionStatus(customerInfo: CustomerInfo): StoreSubscriptionInfo {
  const entitlement = customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID];

  if (!entitlement) {
    return {
      isActive: false,
      willRenew: false,
      expirationDate: null,
      store: null,
      productIdentifier: null,
      subscriptionStatus: 'expired',
    };
  }

  const store =
    entitlement.store === 'APP_STORE'
      ? ('app_store' as const)
      : entitlement.store === 'PLAY_STORE'
        ? ('play_store' as const)
        : null;

  let subscriptionStatus: SubscriptionStatus = 'active';
  if (entitlement.unsubscribeDetectedAt) {
    subscriptionStatus = 'cancelled';
  }
  if (entitlement.billingIssueDetectedAt) {
    subscriptionStatus = 'grace_period';
  }

  return {
    isActive: true,
    willRenew: !entitlement.unsubscribeDetectedAt,
    expirationDate: entitlement.expirationDate,
    store,
    productIdentifier: entitlement.productIdentifier,
    subscriptionStatus,
  };
}

/**
 * Register a listener for customer info updates (entitlement changes).
 * Returns a cleanup function to remove the listener.
 */
export function addEntitlementListener(callback: (customerInfo: CustomerInfo) => void): () => void {
  if (!isInitialized) return () => {};

  const remove = Purchases.addCustomerInfoUpdateListener(callback);
  // SDK returns a remove function or void depending on version
  return typeof remove === 'function' ? remove : () => {};
}

/**
 * Fetch available offerings (products with localized pricing) from RevenueCat.
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isInitialized) return null;

  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

/**
 * Purchase the monthly subscription package.
 */
export async function purchaseMonthlySubscription(): Promise<PurchaseResult> {
  if (!isInitialized) {
    return { success: false, error: 'SDK non initialisé' };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const monthly = offerings.current?.monthly;

    if (!monthly) {
      return { success: false, error: 'Offre non disponible' };
    }

    const { customerInfo } = await Purchases.purchasePackage(monthly);
    return { success: true, customerInfo };
  } catch (error: unknown) {
    const purchasesError = error as { userCancelled?: boolean; message?: string };
    if (purchasesError.userCancelled) {
      return { success: false, userCancelled: true };
    }
    return {
      success: false,
      error: purchasesError.message || 'Erreur de paiement',
    };
  }
}

/**
 * Restore previous purchases. Returns whether a premium entitlement was found.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!isInitialized) {
    return { restored: false };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const restored = isPremiumActive(customerInfo);
    return { restored, customerInfo };
  } catch {
    return { restored: false };
  }
}

/**
 * Check if SDK is ready for use.
 */
export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

// For testing
export function __resetForTesting(): void {
  isInitialized = false;
}
