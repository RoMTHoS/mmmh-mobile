import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../ui/Skeleton';
import { colors, spacing, radius } from '../../theme';

export function RecipeCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={120} borderRadius={0} />
      <View style={styles.content}>
        <Skeleton width="80%" height={16} />
        <Skeleton width={60} height={14} style={styles.badge} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
  },
  badge: {
    marginTop: spacing.xs,
  },
});
