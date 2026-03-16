import { View, Text, StyleSheet } from 'react-native';
import type { Ingredient } from '../../types';
import { fonts, colors, spacing } from '../../theme';

interface IngredientListProps {
  ingredients: Ingredient[];
}

export function IngredientList({ ingredients }: IngredientListProps) {
  if (ingredients.length === 0) {
    return <Text style={styles.emptyText}>No ingredients listed</Text>;
  }

  return (
    <View style={styles.container} testID="ingredient-list">
      {ingredients.map((ingredient, index) => {
        const qty = [ingredient.quantity, ingredient.unit].filter(Boolean).join(' ');
        return (
          <View key={index} style={styles.row} testID={`ingredient-item-${index}`}>
            <Text style={styles.name}>{ingredient.name}</Text>
            {qty ? <Text style={styles.quantity}>{qty}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border + '30',
  },
  name: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  quantity: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 22,
    marginLeft: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
