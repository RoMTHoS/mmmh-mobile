import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { PremiumIcon } from '../ui';
import { colors, fonts, spacing, radius } from '../../theme';
import { submitImport } from '../../services/import';
import { useImportStore } from '../../stores/importStore';
import { Toast } from '../../utils/toast';

const GOLD = '#D4A017';
import type { PlanTier } from '../../types';

interface PostImportPromptProps {
  /** Which pipeline was used for the import */
  pipeline: 'vps' | 'gemini';
  /** Current user tier */
  tier: PlanTier;
  /** Whether user can still activate a trial */
  canActivateTrial: boolean;
  /** Remaining free Gemini imports available */
  geminiQuotaRemaining: number;
  /** Source URL of the imported recipe */
  sourceUrl: string;
  /** Import type used */
  importType: 'video' | 'website' | 'photo' | 'text';
}

/**
 * Subtle card shown after import completes on the review screen.
 * - Free (VPS): trial CTA if eligible
 * - Trial/Premium (Gemini): "Premium quality" success badge
 */
export function PostImportPrompt({
  pipeline,
  tier,
  canActivateTrial,
  geminiQuotaRemaining,
  sourceUrl,
  importType,
}: PostImportPromptProps) {
  const addJob = useImportStore.getState().addJob;

  const handlePremiumImport = () => {
    Alert.alert(
      'Import Premium',
      'Reimporter cette recette avec le pipeline Premium pour de meilleurs resultats ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const response = await submitImport({
                importType,
                sourceUrl,
                forcePremium: true,
              });

              addJob({
                jobId: response.jobId,
                status: response.status,
                sourceUrl,
                importType,
                platform: undefined,
                pipeline: 'gemini',
                progress: 0,
                createdAt: response.createdAt || new Date().toISOString(),
              });

              Toast.show({
                type: 'success',
                text1: 'Import Premium lance',
                text2: 'Retrouvez la recette dans vos imports',
              });

              router.back();
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: "Impossible de lancer l'import Premium",
              });
            }
          },
        },
      ]
    );
  };

  // After premium/trial import with Gemini → no CTA needed
  if (pipeline === 'gemini') {
    return null;
  }

  // After free import with VPS → CTA buttons
  if (tier === 'free') {
    const hasFreePremium = geminiQuotaRemaining > 0;

    if (!hasFreePremium && !canActivateTrial) return null;

    return (
      <View style={styles.ctaContent} testID="post-import-prompt-cta">
        <Text style={styles.ctaText}>Envie de meilleurs resultats ?</Text>
        {hasFreePremium && (
          <Pressable
            style={styles.ctaButton}
            onPress={handlePremiumImport}
            testID="post-import-premium-import"
          >
            <View style={styles.ctaButtonInner}>
              <PremiumIcon width={16} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>Import premium</Text>
              <PremiumIcon width={16} color="#FFFFFF" />
            </View>
          </Pressable>
        )}
        <Pressable
          style={[styles.ctaButton, styles.ctaButtonSecondary]}
          onPress={() => router.push('/upgrade')}
          testID="post-import-upgrade"
        >
          <View style={styles.ctaButtonInner}>
            <PremiumIcon width={16} color="#FFFFFF" />
            <Text style={[styles.ctaButtonText, styles.ctaButtonSecondaryText]}>
              Passer premium
            </Text>
            <PremiumIcon width={16} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  ctaContent: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ctaText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
  },
  ctaButton: {
    backgroundColor: GOLD,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  ctaButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaButtonSecondary: {
    backgroundColor: '#000000',
  },
  ctaButtonText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: '#FFFFFF',
  },
  ctaButtonSecondaryText: {
    color: '#FFFFFF',
  },
});
