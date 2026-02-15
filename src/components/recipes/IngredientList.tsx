import { View, Text, StyleSheet } from 'react-native';
import type { Ingredient } from '../../types';

interface IngredientListProps {
  ingredients: Ingredient[];
}

function formatIngredient(ingredient: Ingredient): string {
  const parts: string[] = [];
  if (ingredient.quantity) parts.push(ingredient.quantity);
  if (ingredient.unit) parts.push(ingredient.unit);
  parts.push(ingredient.name);
  return parts.join(' ');
}

export function IngredientList({ ingredients }: IngredientListProps) {
  if (ingredients.length === 0) {
    return <Text style={styles.emptyText}>No ingredients listed</Text>;
  }

  return (
    <View style={styles.container} testID="ingredient-list">
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.item} testID={`ingredient-item-${index}`}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{formatIngredient(ingredient)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  bullet: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  text: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
