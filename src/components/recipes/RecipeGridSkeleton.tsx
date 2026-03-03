import { View, StyleSheet } from 'react-native';
import { RecipeCardSkeleton } from './RecipeCardSkeleton';
import { spacing } from '../../theme';

const SKELETON_COUNT = 6;

export function RecipeGridSkeleton() {
  const rows = [];
  for (let i = 0; i < SKELETON_COUNT; i += 2) {
    rows.push(
      <View key={i} style={styles.row}>
        <RecipeCardSkeleton />
        <RecipeCardSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="Chargement des recettes">
      {rows}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
});
