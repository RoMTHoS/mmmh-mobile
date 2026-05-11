/**
 * Analytics event name constants for Mixpanel tracking.
 *
 * @see Story 6.1 Task 4
 */

export const EVENTS = {
  // App lifecycle
  APP_OPENED: 'App Opened',

  // Onboarding
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_SLIDE_VIEWED: 'Onboarding Slide Viewed',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_SKIPPED: 'Onboarding Skipped',

  // Recipe CRUD
  RECIPE_CREATED: 'Recipe Created',
  RECIPE_IMPORTED: 'Recipe Imported',
  RECIPE_VIEWED: 'Recipe Viewed',
  RECIPE_EDITED: 'Recipe Edited',
  RECIPE_DELETED: 'Recipe Deleted',

  // Import flow
  IMPORT_STARTED: 'Import Started',
  IMPORT_FAILED: 'Import Failed',
  IMPORT_SUCCEEDED: 'Import Succeeded',

  // Quota
  QUOTA_REACHED: 'Quota Reached',

  // Settings
  SETTINGS_VIEWED: 'Settings Viewed',

  // Trial & plan
  TRIAL_STARTED: 'Trial Started',
  TRIAL_EXPIRED: 'Trial Expired',
  PLAN_UPGRADED: 'Plan Upgraded',

  // Feedback (Story 6.2)
  FEEDBACK_FORM_OPENED: 'Feedback Form Opened',
  FEEDBACK_SUBMITTED: 'Feedback Submitted',
  FEEDBACK_PROMPT_SHOWN: 'Feedback Prompt Shown',
  FEEDBACK_PROMPT_ACCEPTED: 'Feedback Prompt Accepted',
  FEEDBACK_PROMPT_DISMISSED: 'Feedback Prompt Dismissed',

  // Settings (Story 6.3)
  HELP_RESOURCE_ACCESSED: 'Help Resource Accessed',
  SHARE_APP_TAPPED: 'Share App Tapped',
  CLEAR_DATA_INITIATED: 'Clear Data Initiated',
  CLEAR_DATA_CONFIRMED: 'Clear Data Confirmed',

  // Paywall
  PAYWALL_VIEWED: 'Paywall Viewed',

  // Purchase (Story 7.4)
  PURCHASE_INITIATED: 'Purchase Initiated',
  PURCHASE_COMPLETED: 'Purchase Completed',
  PURCHASE_CANCELLED: 'Purchase Cancelled',
  PURCHASE_FAILED: 'Purchase Failed',
  RESTORE_INITIATED: 'Restore Initiated',
  RESTORE_COMPLETED: 'Restore Completed',
  RESTORE_NOT_FOUND: 'Restore Not Found',

  // Subscription lifecycle (Story 7.5)
  SUBSCRIPTION_RENEWED: 'Subscription Renewed',
  SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
  SUBSCRIPTION_EXPIRED: 'Subscription Expired',
  BILLING_ISSUE_DETECTED: 'Billing Issue Detected',
  BILLING_ISSUE_RESOLVED: 'Billing Issue Resolved',
} as const;

export type AnalyticsEventName = (typeof EVENTS)[keyof typeof EVENTS];
