import { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';

import { Text, Icon, MmmhLogo, PremiumIcon } from '../src/components/ui';
import { usePlanStatus, useActivatePremium } from '../src/hooks';
import { Toast } from '../src/utils/toast';
import { trackEvent } from '../src/utils/analytics';
import { colors, fonts, spacing, radius } from '../src/theme';

const PROMO_CODE_MAX = 20;

export default function UpgradeScreen() {
  const planStatus = usePlanStatus();
  const activatePremium = useActivatePremium();

  const [pricingVisible, setPricingVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const isPremium = planStatus?.tier === 'premium';

  const handleCloseModal = useCallback(() => {
    setPricingVisible(false);
    setShowPromoInput(false);
    setPromoCode('');
    setPromoError(null);
  }, []);

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
        handleCloseModal();
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
  }, [promoCode, activatePremium, planStatus, handleCloseModal]);

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
            <Text style={styles.activeSubtext}>
              Vous beneficiez d'imports illimites en haute qualite.
            </Text>
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
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.benefitText}>Importe tes recettes en illimité</Text>
              </View>

              <View style={styles.benefitRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.benefitText}>Sauvegarde tes recettes dans le cloud</Text>
              </View>

              <View style={styles.benefitRow}>
                <Text style={styles.bullet}>•</Text>
                <View>
                  <Text style={styles.benefitText}>IA plus performante</Text>
                  <View style={styles.subBenefits}>
                    <Text style={styles.subBenefitText}>• Harder : Recette plus complette</Text>
                    <Text style={styles.subBenefitText}>• Better : Recette plus précise</Text>
                    <Text style={styles.subBenefitText}>• Faster : Génération plus rapide</Text>
                    <Text style={styles.subBenefitText}>• Stronger : Résultat garantie</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {!isPremium && (
        <View style={styles.bottomButtonContainer}>
          <Pressable style={styles.offresButton} onPress={() => setPricingVisible(true)}>
            <Text style={styles.offresButtonText}>Voir les offres</Text>
          </Pressable>
        </View>
      )}

      {/* Pricing Modal */}
      <Modal
        visible={pricingVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal} />
          <View style={styles.pricingSheet}>
            {!showPromoInput ? (
              <>
                {/* Annual option */}
                <Pressable
                  style={[
                    styles.pricingOption,
                    selectedPlan === 'annual' && styles.pricingOptionSelected,
                  ]}
                  onPress={() => setSelectedPlan('annual')}
                >
                  <View>
                    <Text style={styles.pricingOptionTitle}>Annuel</Text>
                    <Text style={styles.pricingStrikethrough}>71,88 € → 47,88 € / an</Text>
                  </View>
                  <Text style={styles.pricingPrice}>3,99 € / mois</Text>
                </Pressable>

                {/* Monthly option */}
                <Pressable
                  style={[
                    styles.pricingOption,
                    selectedPlan === 'monthly' && styles.pricingOptionSelected,
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                >
                  <Text style={styles.pricingOptionTitle}>Mensuel</Text>
                  <Text style={styles.pricingPrice}>5,99 € / mois</Text>
                </Pressable>

                <Pressable style={styles.promoLink} onPress={() => setShowPromoInput(true)}>
                  <Text style={styles.promoLinkText}>Vous avez un code promo ?</Text>
                </Pressable>

                {/* Continue button */}
                <Pressable style={styles.continueButton} onPress={handleCloseModal}>
                  <Text style={styles.continueButtonText}>Continuer</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.pricingTitle}>Entrez votre code promo</Text>

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
                  />
                  <Pressable
                    style={[styles.continueButton, { flex: 0, paddingHorizontal: spacing.lg }]}
                    onPress={handleActivatePromo}
                    disabled={activatePremium.isPending}
                  >
                    {activatePremium.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.continueButtonText}>Activer</Text>
                    )}
                  </Pressable>
                </View>
                {promoError && <Text style={styles.promoError}>{promoError}</Text>}

                <Pressable
                  style={styles.promoLink}
                  onPress={() => {
                    setShowPromoInput(false);
                    setPromoError(null);
                  }}
                >
                  <Text style={styles.promoLinkText}>Retour aux offres</Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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

  // Bottom fixed button
  bottomButtonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  offresButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  offresButtonText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: '#FFFFFF',
  },

  // Promo
  promoLink: {
    alignSelf: 'center',
  },
  promoLinkText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  // Pricing Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  pricingSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
    gap: spacing.sm,
  },
  pricingTitle: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pricingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border + '40',
    backgroundColor: colors.surfaceAlt,
  },
  pricingOptionSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  pricingOptionTitle: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  pricingStrikethrough: {
    fontFamily: fonts.script,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  pricingPrice: {
    fontFamily: fonts.script,
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  continueButton: {
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  continueButtonText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: '#FFFFFF',
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
  promoError: {
    fontFamily: fonts.script,
    fontSize: 13,
    color: colors.error,
  },

  bottomPadding: {
    height: spacing.xl,
  },
});
