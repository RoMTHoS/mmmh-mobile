import { View, Text, StyleSheet } from 'react-native';
import type { Step } from '../../types';

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
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  numberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instruction: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
