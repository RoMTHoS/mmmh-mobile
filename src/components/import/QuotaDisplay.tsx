import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { usePlanStatus } from '../../hooks';
import { QUOTA } from '../../utils/planConstants';

export function QuotaDisplay() {
  const planStatus = usePlanStatus();

  if (!planStatus || planStatus.tier === 'premium') return null;

  const geminiPerWeek =
    planStatus.tier === 'trial' ? QUOTA.TRIAL_GEMINI_PER_WEEK : QUOTA.FREE_GEMINI_PER_WEEK;
  const geminiRemaining = planStatus.geminiQuotaRemaining ?? 0;
  const premiumUsed = geminiPerWeek - geminiRemaining;
  const premiumRatio = premiumUsed / geminiPerWeek;

  const barColor = '#DAA520';
  const trackStyle =
    premiumRatio === 0
      ? { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DAA520' }
      : { backgroundColor: 'rgba(255,255,255,0.3)' };

  return (
    <View style={styles.container} testID="quota-display">
      <View style={styles.row}>
        <Text style={styles.label} testID="quota-vps-text">
          Import premium : {premiumUsed}/{geminiPerWeek} cette semaine
        </Text>
      </View>
      <View style={[styles.progressTrack, trackStyle]} testID="quota-progress-bar">
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(premiumRatio * 100, 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    width: '100%',
    backgroundColor: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.body,
    color: '#DAA520',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  geminiText: {
    ...typography.caption,
  },
});
