import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '../../src/utils/toast';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { PremiumIcon } from '../../src/components/ui';
import { SettingsSection } from '../../src/components/settings/SettingsSection';
import { SettingsRow } from '../../src/components/settings/SettingsRow';
import { initDeviceId, getDeviceId } from '../../src/services/planSync';
import { getDatabase } from '../../src/services/database';
import { analytics } from '../../src/services/analytics';
import { EVENTS } from '../../src/utils/analyticsEvents';
import { usePlanStatus, useUserPlan } from '../../src/hooks';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER =
  Constants.expoConfig?.ios?.buildNumber ??
  Constants.expoConfig?.android?.versionCode?.toString() ??
  '1';

const URLS = {
  privacy: 'https://mymealmatehelper.com/privacy',
  terms: 'https://mymealmatehelper.com/terms',
  download: 'https://mymealmatehelper.com/download',
} as const;

const SUPPORT_EMAIL = 'support@mymealmatehelper.com';

const TIER_BADGE_CONFIG = {
  free: { label: 'Standard', bg: colors.surface, border: colors.textMuted, text: colors.textMuted },
  trial: {
    label: 'Standard',
    bg: colors.surface,
    border: colors.textMuted,
    text: colors.textMuted,
  },
  premium: { label: 'Premium', bg: '#FEF3C7', border: '#D4A017', text: '#D4A017' },
} as const;

function PlanUsageSection() {
  const planStatus = usePlanStatus();
  const { data: userPlan } = useUserPlan();

  const handleManageSubscription = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url);
  };

  if (!planStatus) return null;

  const badgeConfig = TIER_BADGE_CONFIG[planStatus.tier];

  const geminiPerWeek = planStatus.tier === 'trial' ? 2 : 2;
  const geminiRemaining = planStatus.geminiQuotaRemaining ?? 0;
  const premiumUsed = geminiPerWeek - geminiRemaining;
  const premiumRatio = premiumUsed / geminiPerWeek;
  const barColor =
    premiumRatio >= 1 ? colors.error : premiumRatio >= 0.7 ? colors.warning : colors.success;

  return (
    <View style={sectionStyles.section} testID="plan-usage-section">
      <Text style={sectionStyles.sectionTitle}>Plan & Utilisation</Text>
      <View style={sectionStyles.sectionContent}>
        <View style={[rowStyles.item, rowStyles.itemLast]}>
          <View style={rowStyles.itemIcon}>
            <PremiumIcon width={22} />
          </View>
          <View style={[rowStyles.itemContent, { gap: spacing.md }]}>
            {/* Tier badge */}
            <View style={planStyles.tierRow}>
              <Text style={rowStyles.itemTitle}>Plan actuel</Text>
              <View
                style={[
                  planStyles.tierBadge,
                  { backgroundColor: badgeConfig.bg, borderColor: badgeConfig.border },
                ]}
                testID="plan-tier-badge"
              >
                <Text style={[planStyles.tierBadgeText, { color: badgeConfig.text }]}>
                  {badgeConfig.label}
                </Text>
              </View>
            </View>

            {planStatus.tier !== 'premium' && (
              <View style={planStyles.progressGroup}>
                <View style={planStyles.progressTrack}>
                  <View
                    style={[
                      planStyles.progressFill,
                      {
                        width: `${Math.min(premiumRatio * 100, 100)}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
                <View style={planStyles.usageRow}>
                  <Text style={rowStyles.itemSubtitle} testID="plan-vps-usage">
                    Premium import utilisé {premiumUsed}/{geminiPerWeek}
                  </Text>
                  <Text style={rowStyles.itemSubtitle}>Réinitialisation : lundi</Text>
                </View>
              </View>
            )}
            {planStatus.tier === 'premium' && (
              <>
                {/* Store subscription: show status-specific info */}
                {planStatus.storeSubscription ? (
                  <>
                    {planStatus.storeSubscription.subscriptionStatus === 'active' && (
                      <View style={planStyles.premiumActiveRow}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text
                          style={[rowStyles.itemSubtitle, { color: colors.success }]}
                          testID="plan-premium-active"
                        >
                          Premium actif
                        </Text>
                      </View>
                    )}
                    {planStatus.storeSubscription.subscriptionStatus === 'active' &&
                      planStatus.storeSubscription.expirationDate && (
                        <Text style={rowStyles.itemSubtitle} testID="plan-renewal-date">
                          Renouvellement le{' '}
                          {new Date(planStatus.storeSubscription.expirationDate).toLocaleDateString(
                            'fr-FR'
                          )}
                        </Text>
                      )}
                    {planStatus.storeSubscription.subscriptionStatus === 'cancelled' && (
                      <>
                        <View style={planStyles.premiumActiveRow}>
                          <Ionicons name="time-outline" size={16} color={colors.warning} />
                          <Text
                            style={[rowStyles.itemSubtitle, { color: colors.warning }]}
                            testID="plan-premium-cancelled"
                          >
                            Premium
                          </Text>
                        </View>
                        {planStatus.storeSubscription.expirationDate && (
                          <Text style={rowStyles.itemSubtitle} testID="plan-expiry-date">
                            Expire le{' '}
                            {new Date(
                              planStatus.storeSubscription.expirationDate
                            ).toLocaleDateString('fr-FR')}
                          </Text>
                        )}
                        <Pressable
                          style={planStyles.upgradeButton}
                          onPress={() => router.push('/upgrade')}
                          testID="plan-resubscribe-button"
                        >
                          <Text style={planStyles.upgradeButtonText}>Se réabonner</Text>
                        </Pressable>
                      </>
                    )}
                    {planStatus.storeSubscription.subscriptionStatus === 'grace_period' && (
                      <>
                        <View style={planStyles.premiumActiveRow}>
                          <Ionicons name="warning-outline" size={16} color={colors.warning} />
                          <Text
                            style={[rowStyles.itemSubtitle, { color: colors.warning }]}
                            testID="plan-premium-grace"
                          >
                            Problème de paiement
                          </Text>
                        </View>
                        <Text style={rowStyles.itemSubtitle}>Vérifiez vos moyens de paiement</Text>
                      </>
                    )}
                    <Pressable
                      style={planStyles.manageButton}
                      onPress={handleManageSubscription}
                      testID="plan-manage-subscription"
                    >
                      <Ionicons name="settings-outline" size={14} color={colors.info} />
                      <Text style={planStyles.manageButtonText}>Gérer mon abonnement</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {/* Promo premium: unchanged from Story 5.6 */}
                    <View style={planStyles.premiumActiveRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text
                        style={[rowStyles.itemSubtitle, { color: colors.success }]}
                        testID="plan-premium-active"
                      >
                        Premium actif
                      </Text>
                    </View>
                    {userPlan?.premiumActivatedDate && (
                      <Text style={rowStyles.itemSubtitle}>
                        Activé le{' '}
                        {new Date(userPlan.premiumActivatedDate).toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                    {userPlan?.promoCode && (
                      <Text style={rowStyles.itemSubtitle} testID="plan-promo-code">
                        Code : {userPlan.promoCode}
                      </Text>
                    )}
                  </>
                )}
              </>
            )}
            {/* Upgrade button */}
            {planStatus.tier !== 'premium' && (
              <Pressable
                style={planStyles.upgradeButton}
                onPress={() => router.push('/upgrade')}
                testID="plan-upgrade-button"
              >
                <View style={planStyles.upgradeButtonInner}>
                  <PremiumIcon width={14} color="#FFFFFF" />
                  <Text style={planStyles.upgradeButtonText}>Passer Premium</Text>
                  <PremiumIcon width={14} color="#FFFFFF" />
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function ThemeSelector() {
  return (
    <SettingsRow
      icon="color-palette-outline"
      title="Apparence"
      value="Clair"
      disabled
      subtitle="Dark mode bientôt disponible"
      testID="theme-toggle"
    />
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  useEffect(() => {
    analytics.track(EVENTS.SETTINGS_VIEWED);
  }, []);

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  const trackHelpResource = (resource: string) => {
    analytics.track(EVENTS.HELP_RESOURCE_ACCESSED, { resource });
  };

  const handleViewTutorial = () => {
    trackHelpResource('tutorial');
    router.push({ pathname: '/onboarding', params: { from: 'settings' } });
  };

  const handleSendFeedback = () => {
    trackHelpResource('feedback');
    router.push('/feedback');
  };

  const handleContactSupport = () => {
    trackHelpResource('support');
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support mmmh`);
  };

  const handleShareApp = async () => {
    analytics.track(EVENTS.SHARE_APP_TAPPED);
    try {
      await Share.share({
        message: `Découvre mmmh, l'app qui transforme tes vidéos de recettes en fiches pratiques ! ${URLS.download}`,
      });
    } catch {
      // User cancelled or share failed — no action needed
    }
  };

  const handleClearAllData = () => {
    analytics.track(EVENTS.CLEAR_DATA_INITIATED);
    Alert.alert(
      'Effacer toutes les données',
      'Êtes-vous sûr ? Toutes les recettes, collections, listes de courses et préférences seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Cette action est irréversible. Toutes vos données seront définitivement perdues.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Tout effacer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      analytics.track(EVENTS.CLEAR_DATA_CONFIRMED);

                      const db = getDatabase();
                      db.runSync('DELETE FROM shopping_list_items');
                      db.runSync('DELETE FROM shopping_list_recipes');
                      db.runSync('DELETE FROM shopping_lists');
                      db.runSync('DELETE FROM recipes');
                      db.runSync('DELETE FROM import_usage');
                      db.runSync(
                        "UPDATE user_plan SET tier = 'free', trial_start_date = NULL, trial_ends_date = NULL, premium_activated_date = NULL, promo_code = NULL"
                      );

                      // Delete persisted photos
                      const photosDir = `${FileSystem.documentDirectory}photos/`;
                      const dirInfo = await FileSystem.getInfoAsync(photosDir);
                      if (dirInfo.exists) {
                        await FileSystem.deleteAsync(photosDir, { idempotent: true });
                      }

                      await AsyncStorage.clear();
                      analytics.reset();
                      queryClient.invalidateQueries();

                      Toast.show({
                        type: 'success',
                        text1: 'Données effacées',
                        text2: 'Toutes les données ont été supprimées',
                      });
                    } catch (error) {
                      Toast.show({
                        type: 'error',
                        text1: 'Erreur',
                        text2: error instanceof Error ? error.message : 'Erreur inconnue',
                      });
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDeleteAllRecipes = async () => {
    Alert.alert(
      'Supprimer toutes les recettes',
      'Cette action est irréversible. Toutes les recettes, ingrédients, instructions et photos seront supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer tout',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              db.runSync('DELETE FROM shopping_list_recipes');
              db.runSync('DELETE FROM shopping_list_items');
              db.runSync('DELETE FROM recipes');

              const photosDir = `${FileSystem.documentDirectory}photos/`;
              const dirInfo = await FileSystem.getInfoAsync(photosDir);
              if (dirInfo.exists) {
                await FileSystem.deleteAsync(photosDir, { idempotent: true });
              }

              queryClient.invalidateQueries();

              Toast.show({
                type: 'success',
                text1: 'Recettes supprimées',
                text2: 'Toutes les recettes ont été effacées',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          },
        },
      ]
    );
  };

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
              await AsyncStorage.removeItem('MMMH_DEVICE_ID');
              const db = getDatabase();
              db.runSync(
                `UPDATE user_plan SET tier = 'free', trial_start_date = NULL, trial_ends_date = NULL, premium_activated_date = NULL, promo_code = NULL, updated_at = ?`,
                [new Date().toISOString()]
              );
              db.runSync(`DELETE FROM import_usage`);
              const newId = await initDeviceId();
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
      testID="settings-screen"
    >
      {/* Account / Plan & Usage */}
      <PlanUsageSection />

      {/* Preferences */}
      <SettingsSection title="Préférences" testID="preferences-section">
        <ThemeSelector />
        <SettingsRow
          icon="scale-outline"
          title="Unités"
          value="Métrique"
          disabled
          subtitle="Bientôt disponible"
          isLast
          testID="units-row"
        />
      </SettingsSection>

      {/* Help */}
      <SettingsSection title="Aide" testID="help-section">
        <SettingsRow
          icon="school-outline"
          title="Voir le tutoriel"
          onPress={handleViewTutorial}
          testID="help-tutorial"
        />
        <SettingsRow
          icon="chatbubble-ellipses-outline"
          title="Envoyer un feedback"
          subtitle="Bug, idée, retour général"
          onPress={handleSendFeedback}
          testID="help-feedback"
        />
        <SettingsRow
          icon="mail-outline"
          title="Contacter le support"
          subtitle={SUPPORT_EMAIL}
          onPress={handleContactSupport}
          isLast
          testID="help-support"
        />
      </SettingsSection>

      {/* About */}
      <SettingsSection title="À propos" testID="about-section">
        <SettingsRow
          icon="information-circle-outline"
          title="Version"
          value={`${APP_VERSION} (${BUILD_NUMBER})`}
          testID="about-version"
        />
        <SettingsRow
          icon="document-text-outline"
          title="Politique de confidentialité"
          onPress={() => openUrl(URLS.privacy)}
          testID="about-privacy"
        />
        <SettingsRow
          icon="reader-outline"
          title="Conditions d'utilisation"
          onPress={() => openUrl(URLS.terms)}
          testID="about-terms"
        />
        <SettingsRow
          icon="share-social-outline"
          title="Partager l'app"
          onPress={handleShareApp}
          testID="share-app"
        />
        <Text style={styles.credits} testID="credits">
          Built with love by RoMTHoS
        </Text>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="Zone de danger" testID="danger-zone-section">
        <SettingsRow
          icon="trash-outline"
          title="Effacer toutes les données"
          subtitle="Supprime recettes, collections et préférences"
          onPress={handleClearAllData}
          destructive
          isLast
          testID="clear-all-data"
        />
      </SettingsSection>

      {/* Developer (debug only) */}
      {__DEV__ && (
        <SettingsSection title="Développeur" testID="dev-section">
          <SettingsRow
            icon="id-card-outline"
            title="Device ID"
            subtitle={getDeviceId()?.slice(0, 8) ?? 'non initialisé'}
          />
          <SettingsRow
            icon="refresh-outline"
            title="Reset trial & device ID"
            subtitle="Remet le plan à free avec un nouveau device"
            onPress={handleResetTrial}
          />
          <SettingsRow
            icon="trash-outline"
            title="Supprimer toutes les recettes"
            subtitle="Efface les recettes, ingrédients et photos"
            onPress={handleDeleteAllRecipes}
            isLast
          />
        </SettingsSection>
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
  credits: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});

const sectionStyles = StyleSheet.create({
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
});

const rowStyles = StyleSheet.create({
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
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
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
  progressGroup: {
    gap: spacing.xs,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
  },
  upgradeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  upgradeButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  manageButtonText: {
    ...typography.caption,
    color: colors.info,
  },
});
