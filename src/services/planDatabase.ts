import uuid from 'react-native-uuid';
import { getDatabase } from './database';
import type { UserPlan, ImportUsage } from '../types';

// --- Row types for SQLite deserialization ---

interface UserPlanRow {
  id: string;
  tier: string;
  trial_start_date: string | null;
  trial_ends_date: string | null;
  premium_activated_date: string | null;
  promo_code: string | null;
  premium_source: string | null;
  subscription_status: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ImportUsageRow {
  id: string;
  usage_date: string;
  vps_imports_used: number;
  gemini_imports_used: number;
  week_start_date: string;
  created_at: string;
}

// --- Deserializers ---

function deserializePlan(row: UserPlanRow): UserPlan {
  return {
    id: row.id,
    tier: row.tier as UserPlan['tier'],
    trialStartDate: row.trial_start_date,
    trialEndsDate: row.trial_ends_date,
    premiumActivatedDate: row.premium_activated_date,
    promoCode: row.promo_code,
    premiumSource: row.premium_source as UserPlan['premiumSource'],
    subscriptionStatus: row.subscription_status as UserPlan['subscriptionStatus'],
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deserializeUsage(row: ImportUsageRow): ImportUsage {
  return {
    id: row.id,
    date: row.usage_date,
    vpsImportsUsed: row.vps_imports_used,
    geminiImportsUsed: row.gemini_imports_used,
    weekStartDate: row.week_start_date,
    createdAt: row.created_at,
  };
}

// --- Helpers ---

export function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = 1, Sunday = 0 → offset to get Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  // Build date string from local components to avoid UTC timezone shift
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dd}`;
}

function getTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dd}`;
}

// --- Plan CRUD ---

export async function getUserPlan(): Promise<UserPlan> {
  const database = getDatabase();

  try {
    const row = database.getFirstSync<UserPlanRow>('SELECT * FROM user_plan LIMIT 1');

    if (!row) {
      // Auto-create default free plan
      const id = uuid.v4() as string;
      const now = new Date().toISOString();
      database.runSync(
        `INSERT INTO user_plan (id, tier, created_at, updated_at) VALUES (?, 'free', ?, ?)`,
        [id, now, now]
      );
      return {
        id,
        tier: 'free',
        trialStartDate: null,
        trialEndsDate: null,
        premiumActivatedDate: null,
        promoCode: null,
        premiumSource: null,
        subscriptionStatus: null,
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      };
    }

    const plan = deserializePlan(row);
    return checkTrialExpiration(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger le forfait. ${message}`);
  }
}

export async function activateTrial(): Promise<UserPlan> {
  const database = getDatabase();

  try {
    const plan = await getUserPlan();

    if (plan.trialStartDate !== null) {
      throw new Error("L'essai gratuit a déjà été utilisé.");
    }

    const now = new Date();
    const endsDate = new Date(now);
    endsDate.setDate(endsDate.getDate() + 7);

    const nowStr = now.toISOString();
    const endsStr = endsDate.toISOString();

    database.runSync(
      `UPDATE user_plan SET tier = 'trial', trial_start_date = ?, trial_ends_date = ?, updated_at = ? WHERE id = ?`,
      [nowStr, endsStr, nowStr, plan.id]
    );

    return {
      ...plan,
      tier: 'trial',
      trialStartDate: nowStr,
      trialEndsDate: endsStr,
      updatedAt: nowStr,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('essai gratuit')) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible d'activer l'essai. ${message}`);
  }
}

export async function activatePremium(promoCode: string): Promise<UserPlan> {
  const database = getDatabase();

  try {
    const plan = await getUserPlan();
    const now = new Date().toISOString();

    database.runSync(
      `UPDATE user_plan SET tier = 'premium', premium_activated_date = ?, promo_code = ?, updated_at = ? WHERE id = ?`,
      [now, promoCode, now, plan.id]
    );

    return {
      ...plan,
      tier: 'premium',
      premiumActivatedDate: now,
      promoCode,
      updatedAt: now,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible d'activer le premium. ${message}`);
  }
}

export async function activateStorePremium(
  subscriptionStatus: string,
  expiresAt: string | null
): Promise<UserPlan> {
  const database = getDatabase();

  try {
    const plan = await getUserPlan();
    const now = new Date().toISOString();

    database.runSync(
      `UPDATE user_plan SET tier = 'premium', premium_activated_date = ?, premium_source = 'store', subscription_status = ?, expires_at = ?, updated_at = ? WHERE id = ?`,
      [now, subscriptionStatus, expiresAt, now, plan.id]
    );

    return {
      ...plan,
      tier: 'premium',
      premiumActivatedDate: now,
      premiumSource: 'store',
      subscriptionStatus: subscriptionStatus as UserPlan['subscriptionStatus'],
      expiresAt,
      updatedAt: now,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible d'activer le premium store. ${message}`);
  }
}

export async function deactivatePremium(): Promise<UserPlan> {
  const database = getDatabase();

  try {
    const plan = await getUserPlan();
    const now = new Date().toISOString();

    database.runSync(
      `UPDATE user_plan SET tier = 'free', premium_activated_date = NULL, premium_source = NULL, subscription_status = NULL, expires_at = NULL, updated_at = ? WHERE id = ?`,
      [now, plan.id]
    );

    return {
      ...plan,
      tier: 'free',
      premiumActivatedDate: null,
      premiumSource: null,
      subscriptionStatus: null,
      expiresAt: null,
      updatedAt: now,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de désactiver le premium. ${message}`);
  }
}

export async function updatePremiumSource(source: UserPlan['premiumSource']): Promise<void> {
  const database = getDatabase();
  const plan = await getUserPlan();
  const now = new Date().toISOString();

  database.runSync(`UPDATE user_plan SET premium_source = ?, updated_at = ? WHERE id = ?`, [
    source,
    now,
    plan.id,
  ]);
}

function checkTrialExpiration(plan: UserPlan): UserPlan {
  if (plan.tier !== 'trial' || !plan.trialEndsDate) {
    return plan;
  }

  if (new Date() > new Date(plan.trialEndsDate)) {
    const database = getDatabase();
    const now = new Date().toISOString();

    database.runSync(`UPDATE user_plan SET tier = 'free', updated_at = ? WHERE id = ?`, [
      now,
      plan.id,
    ]);

    return { ...plan, tier: 'free', updatedAt: now };
  }

  return plan;
}

// --- Usage CRUD ---

export async function getTodayUsage(): Promise<ImportUsage> {
  const database = getDatabase();
  const today = getTodayDate();

  try {
    const row = database.getFirstSync<ImportUsageRow>(
      'SELECT * FROM import_usage WHERE usage_date = ?',
      [today]
    );

    if (!row) {
      const id = uuid.v4() as string;
      const weekStart = getWeekStartDate(new Date());
      const now = new Date().toISOString();

      database.runSync(
        `INSERT INTO import_usage (id, usage_date, vps_imports_used, gemini_imports_used, week_start_date, created_at)
         VALUES (?, ?, 0, 0, ?, ?)`,
        [id, today, weekStart, now]
      );

      return {
        id,
        date: today,
        vpsImportsUsed: 0,
        geminiImportsUsed: 0,
        weekStartDate: weekStart,
        createdAt: now,
      };
    }

    return deserializeUsage(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger l'utilisation. ${message}`);
  }
}

export async function getWeekUsage(): Promise<number> {
  const database = getDatabase();
  const weekStart = getWeekStartDate(new Date());

  try {
    const result = database.getFirstSync<{ total: number }>(
      'SELECT COALESCE(SUM(vps_imports_used), 0) as total FROM import_usage WHERE week_start_date = ?',
      [weekStart]
    );
    return result?.total ?? 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger l'utilisation hebdomadaire. ${message}`);
  }
}

export async function getWeekGeminiUsage(): Promise<number> {
  const database = getDatabase();
  const weekStart = getWeekStartDate(new Date());

  try {
    const result = database.getFirstSync<{ total: number }>(
      'SELECT COALESCE(SUM(gemini_imports_used), 0) as total FROM import_usage WHERE week_start_date = ?',
      [weekStart]
    );
    return result?.total ?? 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger l'utilisation Gemini hebdomadaire. ${message}`);
  }
}

export async function incrementVpsUsage(): Promise<void> {
  const database = getDatabase();
  const usage = await getTodayUsage();

  try {
    database.runSync(
      'UPDATE import_usage SET vps_imports_used = vps_imports_used + 1 WHERE id = ?',
      [usage.id]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de mettre à jour l'utilisation VPS. ${message}`);
  }
}

export async function incrementGeminiUsage(): Promise<void> {
  const database = getDatabase();
  const usage = await getTodayUsage();

  try {
    database.runSync(
      'UPDATE import_usage SET gemini_imports_used = gemini_imports_used + 1 WHERE id = ?',
      [usage.id]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de mettre à jour l'utilisation Gemini. ${message}`);
  }
}
