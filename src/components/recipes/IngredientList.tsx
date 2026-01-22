import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleIngredient = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (ingredients.length === 0) {
    return <Text style={styles.emptyText}>No ingredients listed</Text>;
  }

  return (
    <View style={styles.container} testID="ingredient-list">
      {ingredients.map((ingredient, index) => {
        const isChecked = checked.has(index);

        return (
          <Pressable
            key={index}
            style={styles.item}
            onPress={() => toggleIngredient(index)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked }}
            testID={`ingredient-item-${index}`}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={[styles.text, isChecked && styles.textChecked]}>
              {formatIngredient(ingredient)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  text: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
