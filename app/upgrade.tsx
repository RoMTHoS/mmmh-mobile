import { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { Text, Icon, MmmhLogo, PremiumIcon } from '../src/components/ui';
import {
  usePlanStatus,
  useOfferings,
  usePurchaseSubscription,
  useRestorePurchases,
} from '../src/hooks';
import { Toast } from '../src/utils/toast';
import { analytics } from '../src/services/analytics';
import { EVENTS } from '../src/utils/analyticsEvents';
import { colors, fonts, spacing, radius } from '../src/theme';

const PREMIUM_BENEFITS = [
  'Importation instantanée et illimitée',
  'Détection complète des ingrédients',
  'Quantités et unités ultra précises',
  'File prioritaire',
  'Plans de repas intelligents',
  'Listes de courses automatiques',
];

export default function UpgradeScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const isFromOnboarding = params.from === 'onboarding';

  const planStatus = usePlanStatus();
  const {
    monthlyPriceString,
    annualPriceString,
    isLoading: offeringsLoading,
    error: offeringsError,
    refetch,
  } = useOfferings();
  const { purchase, isPurchasing } = usePurchaseSubscription();
  const { restore, isRestoring } = useRestorePurchases();

  const [showOffersModal, setShowOffersModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isPremium = planStatus?.tier === 'premium';

  const exitPaywall = useCallback(() => {
    if (isFromOnboarding) {
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  }, [isFromOnboarding]);

  useEffect(() => {
    if (isFromOnboarding && !isPremium) {
      analytics.track(EVENTS.PAYWALL_VIEWED, { source: 'onboarding' });
    }
  }, [isFromOnboarding, isPremium]);

  const handleOpenOffers = useCallback(() => {
    if (offeringsError && !offeringsLoading) {
      refetch();
      return;
    }
    setShowOffersModal(true);
  }, [offeringsError, offeringsLoading, refetch]);

  const handlePurchase = useCallback(async () => {
    analytics.track(EVENTS.PURCHASE_INITIATED, { plan: selectedPlan });
    const result = await purchase(selectedPlan);

    if (result.success) {
      setShowOffersModal(false);
      Toast.show({
        type: 'success',
        text1: 'Premium activé !',
        text2: "Profitez d'imports illimités en haute qualité.",
        visibilityTime: 4000,
      });
      setTimeout(exitPaywall, 2000);
    } else if (result.userCancelled) {
      // Silent dismiss — no error shown
    } else if (result.error) {
      Toast.show({
        type: 'error',
        text1: 'Le paiement a échoué.',
        text2: 'Veuillez réessayer.',
        visibilityTime: 4000,
      });
    }
  }, [purchase, selectedPlan, exitPaywall]);

  const handleRestore = useCallback(async () => {
    analytics.track(EVENTS.RESTORE_INITIATED);
    const result = await restore();

    if (result.restored) {
      setShowOffersModal(false);
      Toast.show({
        type: 'success',
        text1: 'Premium restauré avec succès !',
        visibilityTime: 3000,
      });
      setTimeout(exitPaywall, 2000);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Aucun achat précédent trouvé.',
        visibilityTime: 3000,
      });
    }
  }, [restore, exitPaywall]);

  const subscriptionInfo = planStatus?.storeSubscription;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={exitPaywall}
              hitSlop={8}
              style={{ padding: spacing.sm }}
              testID="paywall-back"
            >
              <Icon name="arrow-left" size="lg" color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <View style={[styles.container, styles.content]}>
        {isPremium ? (
          <View style={styles.activeCard} testID="premium-active-card">
            <Icon name="check" size="lg" color={colors.success} />
            <Text style={styles.activeText}>Premium actif</Text>
            {subscriptionInfo ? (
              <Text style={styles.activeSubtext}>
                {subscriptionInfo.expirationDate
                  ? `Renouvellement le ${new Date(subscriptionInfo.expirationDate).toLocaleDateString('fr-FR')}`
                  : "Abonnement actif via l'App Store"}
              </Text>
            ) : (
              <Text style={styles.activeSubtext}>
                {"Vous bénéficiez d'imports illimités en haute qualité."}
              </Text>
            )}
          </View>
        ) : (
          <>
            {/* Crown illustration */}
            <PremiumIcon width={isTablet ? 200 : 130} />
            <View style={styles.brandingSpacing} />

            {/* MMMH PREMIUM branding */}
            <MmmhLogo width={isTablet ? 380 : 260} />
            <Text style={[styles.premiumLabel, isTablet && styles.premiumLabelTablet]}>
              PREMIUM
            </Text>

            <View style={styles.flex} />

            {/* Premium benefits list */}
            <View style={styles.benefitsList} testID="premium-benefits">
              {PREMIUM_BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <Icon name="check" size="md" color={colors.accent} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
            <View style={styles.flex} />
          </>
        )}
      </View>

      {/* Bottom fixed area — main screen */}
      {!isPremium && (
        <View style={styles.bottomButtonWrapper}>
          <View
            style={[styles.bottomButtonContainer, isTablet && styles.bottomButtonContainerTablet]}
          >
            {offeringsError && !offeringsLoading ? (
              <View style={styles.offeringsError}>
                <Text style={styles.offeringsErrorText}>
                  Les offres ne sont pas disponibles actuellement.
                </Text>
                <Pressable onPress={() => refetch()} testID="retry-offerings">
                  <Text style={styles.retryText}>Réessayer</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.seeOffersButton}
                onPress={handleOpenOffers}
                disabled={offeringsLoading}
                testID="subscribe-button"
              >
                {offeringsLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.seeOffersButtonText}>Voir les offres</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Offers bottom sheet modal */}
      <Modal
        visible={showOffersModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOffersModal(false)}
        testID="offers-modal"
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOffersModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {/* Annual plan card */}
            <Pressable
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('annual')}
              testID="plan-card-annual"
            >
              <View style={styles.planCardLeft}>
                <Text style={styles.planCardLabel}>Annuel</Text>
              </View>
              <Text style={styles.planCardPrice}>{annualPriceString ?? '...'} / an</Text>
            </Pressable>

            {/* Monthly plan card */}
            <Pressable
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
              testID="plan-card-monthly"
            >
              <View style={styles.planCardLeft}>
                <Text style={styles.planCardLabel}>Mensuel</Text>
              </View>
              <Text style={styles.planCardPrice}>{monthlyPriceString ?? '...'} / mois</Text>
            </Pressable>

            {/* Continue button */}
            <Pressable
              style={styles.continueButton}
              onPress={handlePurchase}
              disabled={isPurchasing}
              testID="continue-purchase-button"
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>Continuer</Text>
              )}
            </Pressable>

            {/* Restore purchases */}
            <Pressable
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isRestoring}
              testID="restore-button"
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Text style={styles.restoreButtonText}>Restaurer mes achats</Text>
              )}
            </Pressable>

            {/* Subscription terms */}
            <Text style={styles.termsText}>
              {selectedPlan === 'annual'
                ? 'Abonnement annuel. Renouvelable automatiquement. Annulable à tout moment depuis les réglages de votre appareil.'
                : 'Abonnement mensuel. Renouvelable automatiquement. Annulable à tout moment depuis les réglages de votre appareil.'}
            </Text>
            <Text style={styles.termsLinks} numberOfLines={1} adjustsFontSizeToFit>
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://mymealmatehelper.com/terms')}
              >
                {"Conditions d'utilisation"}
              </Text>
              {' • '}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://mymealmatehelper.com/privacy/')}
              >
                Politique de confidentialité
              </Text>
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },

  // Active premium state
  activeCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.success,
    gap: spacing.sm,
    width: '100%',
  },
  activeText: {
    fontFamily: fonts.script,
    fontSize: 20,
    color: colors.success,
  },
  activeSubtext: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },

  flex: {
    flex: 1,
  },
  brandingSpacing: {
    height: spacing.md,
  },

  // Premium benefits list
  benefitsList: {
    width: '100%',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    flex: 1,
    fontFamily: fonts.script,
    fontSize: 19,
    lineHeight: 26,
    color: colors.text,
  },

  // Branding
  premiumLabel: {
    fontFamily: fonts.script,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 6,
    marginTop: 0,
    marginBottom: spacing.sm,
  },

  // Bottom fixed area (main screen)
  bottomButtonWrapper: {
    backgroundColor: colors.background,
  },
  bottomButtonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },

  // "Voir les offres" button
  seeOffersButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  seeOffersButtonText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: '#FFFFFF',
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    gap: spacing.sm,
  },

  // Plan cards (inside modal)
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  planCardLeft: {
    gap: 2,
  },
  planCardLabel: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  planCardSubLabel: {
    fontFamily: fonts.script,
    fontSize: 13,
    color: colors.textMuted,
  },
  planCardPrice: {
    fontFamily: fonts.script,
    fontSize: 15,
    color: colors.text,
  },

  // Continue button
  continueButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  continueButtonText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: '#FFFFFF',
  },

  // Restore
  restoreButton: {
    padding: spacing.xs,
    alignSelf: 'center',
  },
  restoreButtonText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },

  // Terms
  termsText: {
    fontFamily: fonts.script,
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  termsLinks: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  termsLink: {
    textDecorationLine: 'underline' as const,
    color: colors.textMuted,
  },

  // Offerings error
  offeringsError: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  offeringsErrorText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.accent,
    textDecorationLine: 'underline',
  },

  // Tablet overrides
  premiumLabelTablet: {
    fontSize: 36,
    lineHeight: 48,
    letterSpacing: 10,
  },
  bottomButtonContainerTablet: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
});
