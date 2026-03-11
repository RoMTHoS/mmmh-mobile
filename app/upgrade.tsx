import { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';

import { Text, Icon, MmmhLogo, PremiumIcon } from '../src/components/ui';
import {
  usePlanStatus,
  useActivatePremium,
  useOfferings,
  usePurchaseSubscription,
  useRestorePurchases,
} from '../src/hooks';
import { Toast } from '../src/utils/toast';
import { trackEvent } from '../src/utils/analytics';
import { analytics } from '../src/services/analytics';
import { EVENTS } from '../src/utils/analyticsEvents';
import { colors, fonts, spacing, radius } from '../src/theme';

const PROMO_CODE_MAX = 20;

export default function UpgradeScreen() {
  const planStatus = usePlanStatus();
  const activatePremium = useActivatePremium();
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
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const isPremium = planStatus?.tier === 'premium';

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
      setTimeout(() => router.back(), 2000);
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
  }, [purchase, selectedPlan]);

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
      setTimeout(() => router.back(), 2000);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Aucun achat précédent trouvé.',
        visibilityTime: 3000,
      });
    }
  }, [restore]);

  const handleActivatePromo = useCallback(() => {
    if (!promoCode.trim()) {
      setPromoError('Code promo requis');
      return;
    }
    setPromoError(null);
    activatePremium.mutate(promoCode.trim(), {
      onSuccess: () => {
        trackEvent('premium_activated', {
          deviceId: '',
          promoCode: promoCode.trim(),
          previousTier: planStatus?.tier ?? 'free',
        });
        Toast.show({
          type: 'success',
          text1: 'Premium activé !',
          text2: "Profitez d'imports illimités en haute qualité.",
          visibilityTime: 4000,
        });
        router.back();
      },
      onError: (err: Error) => {
        if (err.message.includes('promo') || err.message.includes('code')) {
          setPromoError('Code promo invalide');
        } else {
          setPromoError('Impossible de vérifier le code.');
        }
      },
    });
  }, [promoCode, activatePremium, planStatus]);

  const subscriptionInfo = planStatus?.storeSubscription;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={styles.crownContainer}>
              <PremiumIcon width={150} />
            </View>

            {/* MMMH PREMIUM branding */}
            <MmmhLogo width={280} />
            <Text style={styles.premiumLabel}>PREMIUM</Text>

            {/* Benefits list */}
            <View style={styles.benefitsSection}>
              <View style={styles.benefitRow}>
                <Text style={styles.bullet}>{'•'}</Text>
                <Text style={styles.benefitText}>Importe tes recettes en illimité</Text>
              </View>

              <View style={styles.benefitRow}>
                <Text style={styles.bullet}>{'•'}</Text>
                <Text style={styles.benefitText}>Sauvegarde tes recettes dans le cloud</Text>
              </View>

              <View style={styles.benefitRow}>
                <Text style={styles.bullet}>{'•'}</Text>
                <View>
                  <Text style={styles.benefitText}>IA plus performante</Text>
                  <View style={styles.subBenefits}>
                    <Text style={styles.subBenefitText}>{'•'} Harder : Recette plus complette</Text>
                    <Text style={styles.subBenefitText}>{'•'} Better : Recette plus précise</Text>
                    <Text style={styles.subBenefitText}>{'•'} Faster : Génération plus rapide</Text>
                    <Text style={styles.subBenefitText}>{'•'} Stronger : Résultat garantie</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom fixed area — main screen */}
      {!isPremium && (
        <View style={styles.bottomButtonContainer}>
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

          {/* Promo code collapsible section */}
          {!showPromoInput ? (
            <Pressable onPress={() => setShowPromoInput(true)} testID="promo-toggle">
              <Text style={styles.promoLinkText}>Vous avez un code promo ?</Text>
            </Pressable>
          ) : (
            <View style={styles.promoSection}>
              <View style={styles.promoRow}>
                <TextInput
                  style={[styles.promoInput, promoError && styles.promoInputError]}
                  value={promoCode}
                  onChangeText={(text) => {
                    setPromoCode(text);
                    setPromoError(null);
                  }}
                  placeholder="MMMH-BETA-2026"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={PROMO_CODE_MAX}
                  editable={!activatePremium.isPending}
                  autoFocus
                  testID="promo-input"
                />
                <Pressable
                  style={styles.promoActivateButton}
                  onPress={handleActivatePromo}
                  disabled={activatePremium.isPending}
                  testID="promo-activate"
                >
                  {activatePremium.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.promoActivateText}>Activer</Text>
                  )}
                </Pressable>
              </View>
              {promoError && <Text style={styles.promoError}>{promoError}</Text>}
            </View>
          )}
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
    padding: spacing.md,
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

  // Crown
  crownContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  // Branding
  premiumLabel: {
    fontFamily: fonts.script,
    fontSize: 28,
    lineHeight: 40,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 6,
    marginTop: 0,
    marginBottom: spacing.lg,
  },

  // Benefits
  benefitsSection: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingLeft: spacing.md,
  },
  bullet: {
    fontFamily: fonts.script,
    fontSize: 22,
    color: colors.text,
    lineHeight: 28,
  },
  benefitText: {
    fontFamily: fonts.script,
    fontSize: 20,
    color: colors.text,
    lineHeight: 28,
  },
  subBenefits: {
    marginTop: spacing.xs,
    marginLeft: spacing.md,
    gap: 4,
  },
  subBenefitText: {
    fontFamily: fonts.script,
    fontSize: 17,
    color: colors.text,
    lineHeight: 26,
  },

  // Bottom fixed area (main screen)
  bottomButtonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    gap: spacing.sm,
  },

  // "Voir les offres" button
  seeOffersButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
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
    borderRadius: radius.full,
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

  // Promo
  promoLinkText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  promoSection: {
    width: '100%',
    gap: spacing.xs,
  },
  promoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: fonts.script,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  promoInputError: {
    borderColor: colors.error,
  },
  promoActivateButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoActivateText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: '#FFFFFF',
  },
  promoError: {
    fontFamily: fonts.script,
    fontSize: 13,
    color: colors.error,
  },

  bottomPadding: {
    height: spacing.xl,
  },
});
