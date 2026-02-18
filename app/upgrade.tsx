import { useState, useCallback } from 'react';
import { View, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { Text, Button } from '../src/components/ui';
import { Icon } from '../src/components/ui';
import { usePlanStatus, useActivatePremium } from '../src/hooks';
import { trackEvent } from '../src/utils/analytics';
import { colors, fonts, spacing, radius } from '../src/theme';

const PROMO_CODE_MIN = 4;
const PROMO_CODE_MAX = 20;
const PROMO_CODE_REGEX = /^[A-Za-z0-9-]+$/;

const COMPARISON_ROWS = [
  { feature: 'Imports par semaine', free: '10', premium: 'Illimite' },
  { feature: "Qualite d'import", free: 'Standard', premium: 'Premium (IA avancee)' },
  { feature: "Types d'import", free: 'URL, Photo', premium: 'URL, Photo, Video HD' },
  { feature: 'Reconnaissance', free: 'PaddleOCR + IA locale', premium: 'Google Gemini Vision' },
  { feature: 'Precision', free: 'Bonne', premium: 'Excellente' },
];

const BENEFITS = [
  {
    icon: 'check' as const,
    title: 'Qualite Premium',
    description: 'Gemini Vision AI extrait les recettes avec une meilleure precision',
  },
  {
    icon: 'refresh' as const,
    title: 'Imports illimites',
    description: 'Plus de limites hebdomadaires',
  },
  {
    icon: 'video' as const,
    title: 'Videos completes',
    description: 'Analyse audio + visuelle pour les recettes video',
  },
];

export default function UpgradeScreen() {
  const planStatus = usePlanStatus();
  const activatePremium = useActivatePremium();

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const isPremium = planStatus?.tier === 'premium';

  const validatePromoCode = (code: string): string | null => {
    if (!code.trim()) return 'Code promo requis';
    if (code.length < PROMO_CODE_MIN) return `Minimum ${PROMO_CODE_MIN} caracteres`;
    if (code.length > PROMO_CODE_MAX) return `Maximum ${PROMO_CODE_MAX} caracteres`;
    if (!PROMO_CODE_REGEX.test(code)) return 'Caracteres alphanumeriques et tirets uniquement';
    return null;
  };

  const handleActivate = useCallback(() => {
    const error = validatePromoCode(promoCode);
    if (error) {
      setPromoError(error);
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
          text1: 'Premium active !',
          text2: "Profitez d'imports illimites en haute qualite.",
          visibilityTime: 4000,
        });

        router.back();
      },
      onError: (err: Error) => {
        if (err.message.includes('promo') || err.message.includes('code')) {
          setPromoError('Code promo invalide');
        } else {
          setPromoError('Impossible de verifier le code. Verifiez votre connexion.');
        }
      },
    });
  }, [promoCode, activatePremium, planStatus]);

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
        <Text style={styles.title}>Passez a Premium</Text>

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
            {/* Comparison Table */}
            <View style={styles.table} testID="comparison-table">
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.featureCell]}> </Text>
                <Text style={[styles.tableHeaderCell, styles.tierCell]}>Gratuit</Text>
                <Text style={[styles.tableHeaderCell, styles.tierCell, styles.premiumHeader]}>
                  Premium
                </Text>
              </View>
              {COMPARISON_ROWS.map((row, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, styles.featureCell]}>{row.feature}</Text>
                  <Text style={[styles.tableCell, styles.tierCell]}>{row.free}</Text>
                  <Text style={[styles.tableCell, styles.tierCell, styles.premiumCell]}>
                    {row.premium}
                  </Text>
                </View>
              ))}
            </View>

            {/* Pricing */}
            <View style={styles.pricingSection}>
              <Text style={styles.pricingText}>Gratuit avec code promo</Text>
            </View>

            {/* Promo Code Input */}
            <View style={styles.promoSection} testID="promo-section">
              <Text style={styles.promoLabel}>Code promo</Text>
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
                  testID="promo-input"
                />
                <Button
                  title={activatePremium.isPending ? '' : 'Activer'}
                  onPress={handleActivate}
                  disabled={!promoCode.trim() || activatePremium.isPending}
                  size="md"
                  style={styles.activateButton}
                />
                {activatePremium.isPending && (
                  <ActivityIndicator color={colors.surface} style={styles.activateSpinner} />
                )}
              </View>
              {promoError && (
                <Text style={styles.promoError} testID="promo-error">
                  {promoError}
                </Text>
              )}
            </View>

            {/* Benefits */}
            <View style={styles.benefitsSection}>
              {BENEFITS.map((benefit, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Icon name={benefit.icon} size="md" color={colors.accent} />
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const GOLD = '#D4A017';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 28,
    lineHeight: 44,
    color: colors.text,
    marginBottom: spacing.lg,
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

  // Comparison table
  table: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
  },
  tableHeaderCell: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  tableRowAlt: {
    backgroundColor: colors.surface,
  },
  tableCell: {
    fontFamily: fonts.script,
    fontSize: 12,
    color: colors.text,
    paddingHorizontal: spacing.xs,
  },
  featureCell: {
    flex: 2,
    paddingLeft: spacing.sm,
  },
  tierCell: {
    flex: 1.5,
    textAlign: 'center',
  },
  premiumHeader: {
    color: GOLD,
  },
  premiumCell: {
    color: colors.accent,
    fontWeight: '600',
  },

  // Pricing
  pricingSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pricingText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
  },

  // Promo code
  promoSection: {
    marginBottom: spacing.xl,
  },
  promoLabel: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
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
  activateButton: {
    minWidth: 90,
  },
  activateSpinner: {
    position: 'absolute',
    right: 35,
  },
  promoError: {
    fontFamily: fonts.script,
    fontSize: 13,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Benefits
  benefitsSection: {
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: fonts.script,
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  benefitDescription: {
    fontFamily: fonts.script,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },

  bottomPadding: {
    height: spacing.xl,
  },
});
