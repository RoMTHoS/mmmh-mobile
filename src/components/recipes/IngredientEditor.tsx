import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, TextInput as RNTextInput } from 'react-native';

import { Text } from '../ui';
import { SwipeToDelete } from '../ui/SwipeToDelete';
import { colors, spacing, radius, typography } from '../../theme';

export interface ParsedIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export function parseIngredientsText(text: string): ParsedIngredient[] {
  if (!text.trim()) return [];
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const trimmed = line.trim();
      // Match leading number (with decimals/fractions) + optional unit word + rest as name
      const match = trimmed.match(
        /^(\d+[\d.,/]*)\s+([a-zA-ZéèêëàâäùûüôöïîçÉÈÊËÀÂÄÙÛÜÔÖÏÎÇ]+\.?\s)\s*(.+)$/
      );
      if (match) {
        return {
          quantity: match[1],
          unit: match[2].trim(),
          name: match[3].trim(),
        };
      }
      // Match leading number only (no unit), rest as name
      const numOnly = trimmed.match(/^(\d+[\d.,/]*)\s+(.+)$/);
      if (numOnly) {
        return {
          quantity: numOnly[1],
          unit: '',
          name: numOnly[2].trim(),
        };
      }
      return { name: trimmed, quantity: '', unit: '' };
    });
}

export function ingredientsToText(ingredients: ParsedIngredient[]): string {
  return ingredients
    .map((i) => {
      const parts: string[] = [];
      if (i.quantity) parts.push(i.quantity);
      if (i.unit) parts.push(i.unit);
      parts.push(i.name);
      return parts.join(' ');
    })
    .join('\n');
}

interface IngredientEditorProps {
  ingredients: ParsedIngredient[];
  onIngredientsChange: (ingredients: ParsedIngredient[]) => void;
}

export function IngredientEditor({ ingredients, onIngredientsChange }: IngredientEditorProps) {
  const [ingName, setIngName] = useState('');
  const [ingQuantity, setIngQuantity] = useState('');
  const [ingUnit, setIngUnit] = useState('');

  const handleAdd = useCallback(() => {
    const trimmedName = ingName.trim();
    if (!trimmedName) return;

    const updated = [
      ...ingredients,
      { name: trimmedName, quantity: ingQuantity.trim(), unit: ingUnit.trim() },
    ];
    onIngredientsChange(updated);
    setIngName('');
    setIngQuantity('');
    setIngUnit('');
  }, [ingName, ingQuantity, ingUnit, ingredients, onIngredientsChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onIngredientsChange(ingredients.filter((_, i) => i !== index));
    },
    [ingredients, onIngredientsChange]
  );

  const handleEditField = useCallback(
    (index: number, field: keyof ParsedIngredient, value: string) => {
      const updated = ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing));
      onIngredientsChange(updated);
    },
    [ingredients, onIngredientsChange]
  );

  const renderIngredientRow = useCallback(
    (ing: ParsedIngredient, index: number) => (
      <SwipeToDelete
        onDelete={() => handleRemove(index)}
        confirmMessage={`Supprimer "${ing.name}" ?`}
      >
        <View style={styles.ingredientRow}>
          <RNTextInput
            style={styles.ingredientNameInput}
            value={ing.name}
            onChangeText={(v) => handleEditField(index, 'name', v)}
            placeholder="Nom"
            placeholderTextColor={colors.textLight}
          />
          <View style={styles.ingredientRight}>
            <RNTextInput
              style={styles.ingredientQtyInput}
              value={ing.quantity}
              onChangeText={(v) => handleEditField(index, 'quantity', v)}
              placeholder="Qté"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
            />
            <RNTextInput
              style={styles.ingredientUnitInput}
              value={ing.unit}
              onChangeText={(v) => handleEditField(index, 'unit', v)}
              placeholder="Unité"
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>
      </SwipeToDelete>
    ),
    [handleEditField, handleRemove]
  );

  return (
    <View style={styles.container}>
      {/* Ingredient list */}
      {ingredients.map((ing, index) => (
        <React.Fragment key={`${ing.name}-${index}`}>
          {renderIngredientRow(ing, index)}
        </React.Fragment>
      ))}

      {/* Add ingredient form */}
      <RNTextInput
        style={styles.addInput}
        placeholder="Nom de l'ingrédient"
        placeholderTextColor={colors.textLight}
        value={ingName}
        onChangeText={setIngName}
      />
      <View style={styles.addFormRow}>
        <RNTextInput
          style={[styles.addInput, styles.addSmallInput]}
          placeholder="Qté"
          placeholderTextColor={colors.textLight}
          value={ingQuantity}
          onChangeText={setIngQuantity}
          keyboardType="numeric"
        />
        <RNTextInput
          style={[styles.addInput, styles.addSmallInput]}
          placeholder="Unité"
          placeholderTextColor={colors.textLight}
          value={ingUnit}
          onChangeText={setIngUnit}
        />
      </View>
      <Pressable
        style={[styles.addButton, !ingName.trim() && styles.addButtonDisabled]}
        onPress={handleAdd}
        disabled={!ingName.trim()}
      >
        <Text style={styles.addButtonText}>Ajouter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ingredientNameInput: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingVertical: 0,
  },
  ingredientRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ingredientQtyInput: {
    ...typography.body,
    color: colors.textMuted,
    width: 45,
    textAlign: 'right',
    paddingVertical: 0,
  },
  ingredientUnitInput: {
    ...typography.body,
    color: colors.textMuted,
    width: 50,
    textAlign: 'left',
    paddingVertical: 0,
  },
  addInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    color: colors.text,
  },
  addFormRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addSmallInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
