import { View, Text, StyleSheet } from 'react-native';
import type { Step } from '../../types';
import { colors, spacing, fonts } from '../../theme';

interface StepListProps {
  steps: Step[];
}

export function StepList({ steps }: StepListProps) {
  if (steps.length === 0) {
    return <Text style={styles.emptyText}>No instructions listed</Text>;
  }

  return (
    <View style={styles.container} testID="step-list">
      {steps.map((step, index) => (
        <View key={index} style={styles.step} testID={`step-item-${index}`}>
          <View style={styles.numberContainer}>
            <Text style={styles.number}>{step.order}</Text>
          </View>
          <Text style={styles.instruction}>{step.instruction}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  numberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontFamily: fonts.sans,
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  instruction: {
    fontFamily: fonts.sans,
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
