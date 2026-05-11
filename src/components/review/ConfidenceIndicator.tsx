import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fonts } from '../../theme';
import { Icon } from '../ui';
import { PipelineBadge } from '../import/PipelineBadge';

interface Props {
  confidence: number;
  pipeline?: 'vps' | 'gemini' | null;
}

export function ConfidenceIndicator({ confidence, pipeline }: Props) {
  const getConfidenceLevel = () => {
    if (confidence >= 0.8) return { label: 'Elevee', color: colors.success };
    if (confidence >= 0.6) return { label: 'Moyenne', color: colors.warning };
    return { label: 'Faible', color: colors.error };
  };

  const { label, color } = getConfidenceLevel();
  const percentage = Math.round(confidence * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confiance IA</Text>
        <View style={styles.headerRight}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{label}</Text>
          </View>
          {pipeline && <PipelineBadge pipeline={pipeline} size="md" />}
        </View>
      </View>

      <Text style={styles.percentage}>{percentage}% de confiance</Text>

      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>

      {confidence < 0.6 && (
        <View style={styles.warningContainer}>
          <Icon name="alert" size="sm" color={colors.error} />
          <Text style={styles.warning}>
            Confiance faible - verifiez attentivement tous les champs
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.xs,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: colors.textMuted,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.sm,
  },
  warning: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
  },
});
