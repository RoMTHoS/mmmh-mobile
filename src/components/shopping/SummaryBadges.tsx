import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';
import type { ShoppingList } from '../../types';

interface SummaryBadgesProps {
  list: ShoppingList;
}

export function SummaryBadges({ list }: SummaryBadgesProps) {
  return (
    <View style={styles.container} testID="summary-badges">
      <View style={styles.badge}>
        <Ionicons name="person-outline" size={16} color={colors.text} />
        <Text style={styles.badgeText}>{list.mealCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.bodySmall,
    color: colors.text,
  },
});
