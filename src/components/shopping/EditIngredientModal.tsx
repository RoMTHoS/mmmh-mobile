import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import type { ShoppingListItem, IngredientCategoryCode } from '../../types';
import { INGREDIENT_CATEGORIES } from '../../types';

interface EditIngredientModalProps {
  item: ShoppingListItem | null;
  visible: boolean;
  onClose: () => void;
  onSave: (
    itemId: string,
    updates: Partial<Pick<ShoppingListItem, 'name' | 'quantity' | 'unit' | 'category'>>,
    convertToManual: boolean
  ) => void;
}

const categoryEntries = Object.entries(INGREDIENT_CATEGORIES) as [IngredientCategoryCode, string][];

export function EditIngredientModal({ item, visible, onClose, onSave }: EditIngredientModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState<IngredientCategoryCode>('other');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity != null ? String(item.quantity) : '');
      setUnit(item.unit ?? '');
      setCategory(item.category ?? 'other');
    }
  }, [item]);

  const handleSave = () => {
    if (!item || !name.trim()) return;

    const updates: Partial<Pick<ShoppingListItem, 'name' | 'quantity' | 'unit' | 'category'>> = {};

    if (name.trim() !== item.name) updates.name = name.trim();

    const newQty = quantity ? Number(quantity) : null;
    if (newQty !== item.quantity) updates.quantity = newQty;

    const newUnit = unit.trim() || null;
    if (newUnit !== item.unit) updates.unit = newUnit;

    if (category !== item.category) updates.category = category;

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    // Convert recipe-sourced items to manual when edited
    const shouldConvert = item.sourceType === 'recipe';
    onSave(item.id, updates, shouldConvert);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" testID="edit-ingredient-modal">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Modifier l'ingrédient</Text>

          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nom de l'ingrédient"
            placeholderTextColor={colors.textLight}
            testID="edit-name-input"
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Quantité</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Qté"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                testID="edit-quantity-input"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Unité</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="Unité"
                placeholderTextColor={colors.textLight}
                testID="edit-unit-input"
              />
            </View>
          </View>

          <Text style={styles.label}>Catégorie</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {categoryEntries.map(([code, label]) => (
              <Pressable
                key={code}
                style={[styles.categoryChip, category === code && styles.categoryChipActive]}
                onPress={() => setCategory(code)}
                testID={`category-${code}`}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === code && styles.categoryChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {item?.sourceType === 'recipe' && (
            <Text style={styles.warning} testID="convert-warning">
              Modifier un ingrédient issu d'une recette le détachera de sa source.
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose} testID="edit-cancel-button">
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, !name.trim() && styles.saveDisabled]}
              onPress={handleSave}
              disabled={!name.trim()}
              testID="edit-save-button"
            >
              <Text style={styles.saveText}>Enregistrer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
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
  halfField: {
    flex: 1,
  },
  categoryScroll: {
    marginTop: spacing.xs,
  },
  categoryContent: {
    gap: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.accent,
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  warning: {
    ...typography.bodySmall,
    color: colors.warning,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  saveDisabled: {
    opacity: 0.5,
  },
  saveText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
