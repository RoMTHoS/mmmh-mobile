import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { usePlanStatus } from '../../hooks';

export function TrialStatusBadge() {
  const planStatus = usePlanStatus();

  if (!planStatus || planStatus.tier !== 'trial') return null;

  const daysRemaining = planStatus.trialDaysRemaining ?? 0;
  const hasGeminiQuota = planStatus.geminiQuotaRemaining > 0;
  const statusColor = hasGeminiQuota ? colors.success : colors.warning;

  const daysText =
    daysRemaining === 1 ? 'Essai : 1 jour restant' : `Essai : ${daysRemaining} jours restants`;

  const quotaText = hasGeminiQuota
    ? "1 import premium aujourd'hui"
    : "import premium utilise aujourd'hui";

  return (
    <View style={[styles.container, { borderColor: statusColor }]} testID="trial-status-badge">
      <Text style={styles.daysText} testID="trial-days-text">
        {daysText}
      </Text>
      <Text style={[styles.quotaText, { color: statusColor }]} testID="trial-quota-text">
        ({quotaText})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  daysText: {
    ...typography.label,
    color: colors.text,
  },
  quotaText: {
    ...typography.caption,
  },
});
