import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import { Icon } from '../ui';
import { useAddRecipeToList, useRemoveRecipeFromList } from '../../hooks/useShoppingList';
import { colors, typography, spacing, radius } from '../../theme';
import type { Recipe } from '../../types/recipe';
import type { ShoppingListRecipe } from '../../types/shopping';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 20;
const DEFAULT_SERVINGS = 4;

interface ServingsSelectorProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe;
  listId: string;
  existingEntry: ShoppingListRecipe | null;
}

function scaleQuantity(
  quantity: string | null,
  recipeServings: number,
  selectedServings: number
): string | null {
  if (!quantity) return null;
  const num = parseFloat(quantity);
  if (isNaN(num)) return quantity;
  const scaled = (num / recipeServings) * selectedServings;
  // Show whole numbers or up to 1 decimal
  return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
}

export function ServingsSelector({
  visible,
  onClose,
  recipe,
  listId,
  existingEntry,
}: ServingsSelectorProps) {
  const recipeServings = recipe.servings ?? DEFAULT_SERVINGS;
  const initialServings = existingEntry
    ? Math.round(existingEntry.servingsMultiplier * recipeServings)
    : recipeServings;

  const [selectedServings, setSelectedServings] = useState(initialServings);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const addMutation = useAddRecipeToList();
  const removeMutation = useRemoveRecipeFromList();

  const isInList = existingEntry !== null;

  // Reset servings when modal opens
  useEffect(() => {
    if (visible) {
      const resetServings = existingEntry
        ? Math.round(existingEntry.servingsMultiplier * recipeServings)
        : recipeServings;
      setSelectedServings(resetServings);

      slideAnim.setValue(400);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    }
  }, [visible, existingEntry, recipeServings, slideAnim, backdropAnim]);

  const scaledIngredients = useMemo(
    () =>
      recipe.ingredients.map((ing) => ({
        name: ing.name,
        quantity: scaleQuantity(ing.quantity, recipeServings, selectedServings),
        unit: ing.unit,
      })),
    [recipe.ingredients, recipeServings, selectedServings]
  );

  const handleDecrement = () => {
    setSelectedServings((prev) => Math.max(MIN_SERVINGS, prev - 1));
  };

  const handleIncrement = () => {
    setSelectedServings((prev) => Math.min(MAX_SERVINGS, prev + 1));
  };

  const handleAdd = () => {
    if (!listId) return;
    const multiplier = selectedServings / recipeServings;
    addMutation.mutate(
      { listId, recipeId: recipe.id, servingsMultiplier: multiplier },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: isInList ? 'Portions mises à jour' : 'Recette ajoutée à la liste de courses',
          });
          onClose();
        },
      }
    );
  };

  const handleRemove = () => {
    if (!listId) return;
    removeMutation.mutate(
      { listId, recipeId: recipe.id },
      {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: 'Recette retirée de la liste' });
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} pointerEvents="none" />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            {/* Title */}
            <Text style={styles.title} numberOfLines={1} testID="servings-title">
              {recipe.title}
            </Text>

            {/* Servings Stepper */}
            <View style={styles.stepperRow} testID="servings-stepper">
              <Text style={styles.stepperLabel}>Portions</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={handleDecrement}
                  style={[
                    styles.stepperButton,
                    selectedServings <= MIN_SERVINGS && styles.stepperButtonDisabled,
                  ]}
                  disabled={selectedServings <= MIN_SERVINGS}
                  accessibilityLabel="Diminuer les portions"
                  testID="stepper-decrement"
                >
                  <Icon
                    name="minus"
                    size="sm"
                    color={selectedServings <= MIN_SERVINGS ? colors.textLight : colors.text}
                  />
                </Pressable>
                <Text style={styles.stepperValue} testID="stepper-value">
                  {selectedServings}
                </Text>
                <Pressable
                  onPress={handleIncrement}
                  style={[
                    styles.stepperButton,
                    selectedServings >= MAX_SERVINGS && styles.stepperButtonDisabled,
                  ]}
                  disabled={selectedServings >= MAX_SERVINGS}
                  accessibilityLabel="Augmenter les portions"
                  testID="stepper-increment"
                >
                  <Icon
                    name="plus"
                    size="sm"
                    color={selectedServings >= MAX_SERVINGS ? colors.textLight : colors.text}
                  />
                </Pressable>
              </View>
            </View>

            {/* Ingredient Preview */}
            {scaledIngredients.length > 0 && (
              <View style={styles.previewContainer} testID="ingredient-preview">
                <Text style={styles.previewTitle}>Aperçu des ingrédients</Text>
                {scaledIngredients.slice(0, 5).map((ing, i) => (
                  <Text key={i} style={styles.previewItem} numberOfLines={1}>
                    {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
                  </Text>
                ))}
                {scaledIngredients.length > 5 && (
                  <Text style={styles.previewMore}>
                    +{scaledIngredients.length - 5} ingrédient
                    {scaledIngredients.length - 5 > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            {isInList ? (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.primaryButton]}
                  onPress={handleAdd}
                  disabled={addMutation.isPending}
                  testID="update-servings-button"
                >
                  <Text style={styles.primaryButtonText}>Modifier les portions</Text>
                </Pressable>
                <Pressable
                  style={styles.removeButton}
                  onPress={handleRemove}
                  disabled={removeMutation.isPending}
                  testID="remove-from-list-button"
                >
                  <Text style={styles.removeButtonText}>Retirer de la liste</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.primaryButton}
                onPress={handleAdd}
                disabled={addMutation.isPending}
                testID="add-to-list-button"
              >
                <Icon name="cart" size="md" color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Ajouter à la liste</Text>
              </Pressable>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheetContainer: {
    margin: spacing.md,
    marginBottom: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.modalBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.titleScript,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  stepperLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    ...typography.h3,
    color: colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  previewContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  previewTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  previewItem: {
    ...typography.bodySmall,
    color: colors.textMuted,
    paddingVertical: 2,
  },
  previewMore: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  primaryButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  removeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  removeButtonText: {
    ...typography.buttonSmall,
    color: colors.error,
  },
});
