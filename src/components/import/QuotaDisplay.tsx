import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { usePlanStatus } from '../../hooks';
import { QUOTA } from '../../utils/planConstants';

export function QuotaDisplay() {
  const planStatus = usePlanStatus();

  if (!planStatus || planStatus.tier === 'premium') return null;

  const vpsLimit = planStatus.tier === 'trial' ? QUOTA.TRIAL_VPS_PER_WEEK : QUOTA.FREE_VPS_PER_WEEK;
  const vpsUsed = vpsLimit - planStatus.vpsQuotaRemaining;
  const vpsRatio = vpsUsed / vpsLimit;

  const barColor = vpsRatio >= 1 ? colors.error : vpsRatio >= 0.7 ? colors.warning : colors.success;

  return (
    <View style={styles.container} testID="quota-display">
      <View style={styles.row}>
        <Text style={styles.label} testID="quota-vps-text">
          Imports standard : {vpsUsed}/{vpsLimit} cette semaine
        </Text>
      </View>
      <View style={styles.progressTrack} testID="quota-progress-bar">
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(vpsRatio * 100, 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      {planStatus.tier === 'trial' && (
        <Text
          style={[
            styles.geminiText,
            { color: planStatus.geminiQuotaRemaining > 0 ? colors.success : colors.warning },
          ]}
          testID="quota-gemini-text"
        >
          Import premium :{' '}
          {planStatus.geminiQuotaRemaining > 0 ? "disponible aujourd'hui" : "utilise aujourd'hui"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.text,
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
