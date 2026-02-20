import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { initDeviceId, getDeviceId } from '../../src/services/planSync';
import { getDatabase } from '../../src/services/database';
import { analytics } from '../../src/services/analytics';
import { EVENTS } from '../../src/utils/analyticsEvents';
import { usePlanStatus, useUserPlan } from '../../src/hooks';
import { QUOTA } from '../../src/utils/planConstants';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, isLast }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        isLast && styles.itemLast,
        pressed && styles.itemPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
    </Pressable>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const TIER_BADGE_CONFIG = {
  free: { label: 'Gratuit', bg: colors.surface, border: colors.textMuted, text: colors.textMuted },
  trial: { label: 'Essai', bg: '#EFF6FF', border: colors.info, text: colors.info },
  premium: { label: 'Premium', bg: '#FEF3C7', border: '#D4A017', text: '#D4A017' },
} as const;

function PlanUsageSection() {
  const planStatus = usePlanStatus();
  const { data: userPlan } = useUserPlan();

  if (!planStatus) return null;

  const badgeConfig = TIER_BADGE_CONFIG[planStatus.tier];
  const isTrialExpired = planStatus.tier === 'free' && userPlan?.trialStartDate !== null;

  const vpsLimit = planStatus.tier === 'trial' ? QUOTA.TRIAL_VPS_PER_WEEK : QUOTA.FREE_VPS_PER_WEEK;
  const vpsUsed = planStatus.tier === 'premium' ? 0 : vpsLimit - planStatus.vpsQuotaRemaining;
  const vpsRatio = planStatus.tier === 'premium' ? 0 : vpsUsed / vpsLimit;
  const barColor = vpsRatio >= 1 ? colors.error : vpsRatio >= 0.7 ? colors.warning : colors.success;

  return (
    <View style={styles.section} testID="plan-usage-section">
      <Text style={styles.sectionTitle}>Plan & Utilisation</Text>
      <View style={styles.sectionContent}>
        <View style={[styles.item, styles.itemLast]}>
          <View style={styles.itemIcon}>
            <Ionicons name="diamond-outline" size={22} color={colors.accent} />
          </View>
          <View style={[styles.itemContent, { gap: 6 }]}>
            {/* Tier badge */}
            <View style={planStyles.tierRow}>
              <Text style={styles.itemTitle}>Plan actuel</Text>
              <View
                style={[
                  planStyles.tierBadge,
                  { backgroundColor: badgeConfig.bg, borderColor: badgeConfig.border },
                ]}
                testID="plan-tier-badge"
              >
                <Text style={[planStyles.tierBadgeText, { color: badgeConfig.text }]}>
                  {planStatus.tier === 'trial'
                    ? `${badgeConfig.label} (${planStatus.trialDaysRemaining ?? 0}j)`
                    : badgeConfig.label}
                </Text>
              </View>
            </View>

            {planStatus.tier !== 'premium' && (
              <>
                <Text style={styles.itemSubtitle} testID="plan-vps-usage">
                  Imports cette semaine : {vpsUsed}/{vpsLimit}
                </Text>
                <View style={planStyles.progressTrack}>
                  <View
                    style={[
                      planStyles.progressFill,
                      {
                        width: `${Math.min(vpsRatio * 100, 100)}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
              </>
            )}
            {planStatus.tier === 'trial' && (
              <Text style={styles.itemSubtitle} testID="plan-gemini-usage">
                Import premium aujourd'hui : {planStatus.geminiQuotaRemaining > 0 ? '0/1' : '1/1'}
              </Text>
            )}
            {planStatus.tier === 'premium' && (
              <>
                <View style={planStyles.premiumActiveRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text
                    style={[styles.itemSubtitle, { color: colors.success }]}
                    testID="plan-premium-active"
                  >
                    Premium actif
                  </Text>
                </View>
                {userPlan?.premiumActivatedDate && (
                  <Text style={styles.itemSubtitle}>
                    Active le {new Date(userPlan.premiumActivatedDate).toLocaleDateString('fr-FR')}
                  </Text>
                )}
                {userPlan?.promoCode && (
                  <Text style={styles.itemSubtitle}>Code : {userPlan.promoCode}</Text>
                )}
              </>
            )}
            {planStatus.tier !== 'premium' && (
              <Text style={[styles.itemSubtitle, { marginTop: 2 }]}>Réinitialisation : lundi</Text>
            )}

            {/* Trial expired message */}
            {isTrialExpired && (
              <Text
                style={[styles.itemSubtitle, { color: colors.warning }]}
                testID="plan-trial-expired"
              >
                Votre essai est termine. Passez a Premium
              </Text>
            )}

            {/* Upgrade button */}
            {planStatus.tier !== 'premium' && (
              <Pressable
                style={planStyles.upgradeButton}
                onPress={() => router.push('/upgrade')}
                testID="plan-upgrade-button"
              >
                <Text style={planStyles.upgradeButtonText}>Passer a Premium</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  useEffect(() => {
    analytics.track(EVENTS.SETTINGS_VIEWED);
  }, []);

  const handleResetTrial = async () => {
    Alert.alert(
      'Reset trial & device ID',
      'Ceci va supprimer le device ID, remettre le plan à free, et en générer un nouveau. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear device ID from AsyncStorage
              await AsyncStorage.removeItem('MMMH_DEVICE_ID');

              // Reset plan to free in SQLite
              const db = getDatabase();
              db.runSync(
                `UPDATE user_plan SET tier = 'free', trial_start_date = NULL, trial_ends_date = NULL, premium_activated_date = NULL, promo_code = NULL, updated_at = ?`,
                [new Date().toISOString()]
              );

              // Reset usage counters
              db.runSync(`DELETE FROM import_usage`);

              // Generate new device ID
              const newId = await initDeviceId();

              // Invalidate all queries so UI refreshes
              queryClient.invalidateQueries();

              Toast.show({
                type: 'success',
                text1: 'Reset complete',
                text2: `New device ID: ${newId.slice(0, 8)}...`,
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Reset failed',
                text2: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <PlanUsageSection />

      <MenuSection title="Général">
        <MenuItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Gérer les préférences"
          onPress={() => {
            // TODO: Implement notifications settings
          }}
        />
        <MenuItem
          icon="color-palette-outline"
          title="Apparence"
          subtitle="Mode clair"
          onPress={() => {
            // TODO: Implement appearance settings
          }}
          isLast
        />
      </MenuSection>

      <MenuSection title="Données">
        <MenuItem
          icon="cloud-upload-outline"
          title="Sauvegarde & Sync"
          subtitle="Sauvegarder vos recettes"
          onPress={() => {
            // TODO: V1.0+ - Implement backup
          }}
        />
        <MenuItem
          icon="trash-outline"
          title="Vider le cache"
          onPress={() => {
            // TODO: Implement cache clearing
          }}
          isLast
        />
      </MenuSection>

      <MenuSection title="À propos">
        <MenuItem icon="information-circle-outline" title="Version" subtitle="1.0.0" />
        <MenuItem
          icon="document-text-outline"
          title="Politique de confidentialité"
          onPress={() => {
            // TODO: Open privacy policy
          }}
        />
        <MenuItem
          icon="help-circle-outline"
          title="Aide & Support"
          onPress={() => {
            // TODO: Open help
          }}
          isLast
        />
      </MenuSection>

      {__DEV__ && (
        <MenuSection title="Développeur">
          <MenuItem
            icon="id-card-outline"
            title="Device ID"
            subtitle={getDeviceId()?.slice(0, 8) ?? 'non initialisé'}
          />
          <MenuItem
            icon="refresh-outline"
            title="Reset trial & device ID"
            subtitle="Remet le plan à free avec un nouveau device"
            onPress={handleResetTrial}
            isLast
          />
        </MenuSection>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.base,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemPressed: {
    backgroundColor: colors.background,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body,
    color: colors.text,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});

const planStyles = StyleSheet.create({
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tierBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  premiumActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  upgradeButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.surfaceAlt,
  },
});
