import { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';
import type { IngredientCategoryCode } from '../../types';

interface AddIngredientButtonProps {
  onAdd: (params: {
    name: string;
    quantity?: number;
    unit?: string;
    category?: IngredientCategoryCode;
  }) => void;
}

export function AddIngredientButton({ onAdd }: AddIngredientButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onAdd({
      name: trimmedName,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit.trim() || undefined,
      category: 'other',
    });

    setName('');
    setQuantity('');
    setUnit('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <Pressable
        style={styles.button}
        onPress={() => setIsExpanded(true)}
        testID="add-ingredient-button"
      >
        <Ionicons name="add" size={20} color={colors.accent} />
        <Text style={styles.buttonText}>Ajouter un ingrédient</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.form} testID="add-ingredient-form">
      <TextInput
        style={styles.input}
        placeholder="Nom de l'ingrédient"
        placeholderTextColor={colors.textLight}
        value={name}
        onChangeText={setName}
        autoFocus
        testID="add-ingredient-name"
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="Qté"
          placeholderTextColor={colors.textLight}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          testID="add-ingredient-quantity"
        />
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="Unité"
          placeholderTextColor={colors.textLight}
          value={unit}
          onChangeText={setUnit}
          testID="add-ingredient-unit"
        />
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.cancelButton}
          onPress={() => {
            setIsExpanded(false);
            setName('');
            setQuantity('');
            setUnit('');
          }}
          testID="add-ingredient-cancel"
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>
        <Pressable
          style={[styles.submitButton, !name.trim() && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!name.trim()}
          testID="add-ingredient-submit"
        >
          <Text style={styles.submitText}>Ajouter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
  },
  buttonText: {
    ...typography.body,
    color: colors.accent,
  },
  form: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallInput: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
