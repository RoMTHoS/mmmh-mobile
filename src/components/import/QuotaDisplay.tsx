import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fonts } from '../../theme';
import { usePlanStatus } from '../../hooks';
import { QUOTA } from '../../utils/planConstants';
import { PipelineBadge } from './PipelineBadge';

export function QuotaDisplay() {
  const planStatus = usePlanStatus();

  if (!planStatus || planStatus.tier === 'premium') return null;

  const geminiPerWeek =
    planStatus.tier === 'trial' ? QUOTA.TRIAL_GEMINI_PER_WEEK : QUOTA.FREE_GEMINI_PER_WEEK;
  const geminiRemaining = planStatus.geminiQuotaRemaining ?? 0;
  const premiumUsed = geminiPerWeek - geminiRemaining;
  const premiumRatio = premiumUsed / geminiPerWeek;

  const getBarColor = () => {
    if (premiumRatio >= 1) return colors.error;
    if (premiumRatio >= 0.5) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container} testID="quota-display">
      <View style={styles.header}>
        <Text style={styles.label} testID="quota-vps-text">
          Import premium
        </Text>
        <PipelineBadge pipeline="gemini" size="md" />
      </View>
      <Text style={styles.percentage}>
        {premiumUsed}/{geminiPerWeek} utilises
      </Text>
      <View style={styles.progressTrack} testID="quota-progress-bar">
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(premiumRatio * 100, 100)}%`, backgroundColor: getBarColor() },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
  },
  percentage: {
    fontSize: 12,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
