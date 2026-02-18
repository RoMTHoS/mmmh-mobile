import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../ui';
import { colors, fonts, spacing, radius } from '../../theme';
import type { PlanTier } from '../../types';

interface PostImportPromptProps {
  /** Which pipeline was used for the import */
  pipeline: 'vps' | 'gemini';
  /** Current user tier */
  tier: PlanTier;
  /** Whether user can still activate a trial */
  canActivateTrial: boolean;
}

/**
 * Subtle card shown after import completes on the review screen.
 * - Free (VPS): trial CTA if eligible
 * - Trial/Premium (Gemini): "Premium quality" success badge
 */
export function PostImportPrompt({ pipeline, tier, canActivateTrial }: PostImportPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // After premium/trial import with Gemini → success badge
  if (pipeline === 'gemini') {
    return (
      <View style={[styles.container, styles.successContainer]} testID="post-import-prompt-success">
        <View style={styles.row}>
          <Icon name="check" size="sm" color={colors.success} />
          <Text style={styles.successText}>Importe avec la qualite Premium</Text>
          <Pressable onPress={() => setDismissed(true)} hitSlop={8} testID="post-import-dismiss">
            <Icon name="close" size="sm" color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    );
  }

  // After free import with VPS → trial CTA (only if eligible)
  if (tier === 'free' && canActivateTrial) {
    return (
      <View style={[styles.container, styles.ctaContainer]} testID="post-import-prompt-cta">
        <View style={styles.ctaContent}>
          <Text style={styles.ctaText}>
            Envie de meilleurs resultats ? Essayez Premium gratuitement pendant 7 jours
          </Text>
          <View style={styles.ctaActions}>
            <Pressable
              style={styles.ctaButton}
              onPress={() => router.push('/upgrade')}
              testID="post-import-try-premium"
            >
              <Text style={styles.ctaButtonText}>Essayer</Text>
            </Pressable>
            <Pressable onPress={() => setDismissed(true)} hitSlop={8} testID="post-import-dismiss">
              <Icon name="close" size="sm" color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  successContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: colors.success,
  },
  ctaContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  successText: {
    flex: 1,
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.success,
  },
  ctaContent: {
    gap: spacing.sm,
  },
  ctaText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
  },
  ctaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  ctaButtonText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
