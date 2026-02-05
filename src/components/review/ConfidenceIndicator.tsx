import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { colors, radius, spacing, fonts } from '../../theme';
import { Icon } from '../ui';

interface Props {
  confidence: number;
}

export function ConfidenceIndicator({ confidence }: Props) {
  const [showExplanation, setShowExplanation] = useState(false);

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
        <View style={styles.titleRow}>
          <Text style={styles.title}>Confiance IA</Text>
          <Pressable
            onPress={() => setShowExplanation(!showExplanation)}
            hitSlop={8}
            style={styles.infoButton}
          >
            <Icon name="info" size="sm" color={colors.textMuted} />
          </Pressable>
        </View>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>

      <Text style={styles.percentage}>{percentage}% de confiance</Text>

      {showExplanation && (
        <Text style={styles.explanation}>
          Le score de confiance indique a quel point l&apos;IA est certaine de l&apos;extraction.
          Verifiez attentivement les champs en cas de score faible.
        </Text>
      )}

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
  },
  infoButton: {
    padding: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textMuted,
  },
  explanation: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
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
