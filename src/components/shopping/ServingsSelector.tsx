import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Animated,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Icon } from '../ui';
import {
  useAddRecipeToList,
  useRemoveRecipeFromList,
  useShoppingLists,
  useCreateShoppingList,
} from '../../hooks/useShoppingList';
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
  const [selectedListId, setSelectedListId] = useState(listId);
  const [listPickerVisible, setListPickerVisible] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const addMutation = useAddRecipeToList();
  const removeMutation = useRemoveRecipeFromList();
  const createListMutation = useCreateShoppingList();
  const listsQuery = useShoppingLists(true);
  const lists = listsQuery.data ?? [];

  const isInList = existingEntry !== null;
  const selectedList = lists.find((l) => l.id === selectedListId);

  // Reset servings when modal opens
  useEffect(() => {
    if (visible) {
      const resetServings = existingEntry
        ? Math.round(existingEntry.servingsMultiplier * recipeServings)
        : recipeServings;
      setSelectedServings(resetServings);
      setSelectedListId(listId);
      setListPickerVisible(false);
      setIsCreatingList(false);
      setNewListName('');
      setExcludedIndices(new Set());

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

  const toggleIngredient = (index: number) => {
    setExcludedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleCreateList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    createListMutation.mutate(trimmed, {
      onSuccess: (newList) => {
        setSelectedListId(newList.id);
        setIsCreatingList(false);
        setNewListName('');
        setListPickerVisible(false);
      },
    });
  };

  const handleAdd = () => {
    if (!selectedListId) return;
    const multiplier = selectedServings / recipeServings;
    const excludedNames =
      excludedIndices.size > 0
        ? Array.from(excludedIndices).map((i) => recipe.ingredients[i].name)
        : undefined;
    addMutation.mutate(
      {
        listId: selectedListId,
        recipeId: recipe.id,
        servingsMultiplier: multiplier,
        excludedIngredientNames: excludedNames,
      },
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

            {/* List Picker */}
            <View style={styles.listPickerContainer}>
              <View style={styles.listPickerRow} testID="list-picker">
                <Text style={styles.stepperLabel}>Liste</Text>
                <View>
                  <Pressable
                    style={styles.listPickerButton}
                    onPress={() => {
                      setListPickerVisible(!listPickerVisible);
                      setIsCreatingList(false);
                      setNewListName('');
                    }}
                    testID="list-picker-button"
                  >
                    <Text style={styles.listPickerText} numberOfLines={1}>
                      {selectedList?.name ?? 'Sélectionner'}
                    </Text>
                    <Ionicons
                      name={listPickerVisible ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.text}
                    />
                  </Pressable>
                  {listPickerVisible && (
                    <View style={styles.listPickerDropdown} testID="list-picker-dropdown">
                      {lists.map((l) => (
                        <Pressable
                          key={l.id}
                          style={[
                            styles.listPickerItem,
                            l.id === selectedListId && styles.listPickerItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedListId(l.id);
                            setListPickerVisible(false);
                          }}
                          testID={`list-picker-option-${l.id}`}
                        >
                          <Text
                            style={[
                              styles.listPickerItemText,
                              l.id === selectedListId && styles.listPickerItemTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {l.name}
                          </Text>
                          {l.id === selectedListId && (
                            <Ionicons name="checkmark" size={16} color={colors.accent} />
                          )}
                        </Pressable>
                      ))}
                      {isCreatingList ? (
                        <View style={styles.createListInput}>
                          <TextInput
                            style={styles.createListTextInput}
                            value={newListName}
                            onChangeText={setNewListName}
                            placeholder="Nom de la liste"
                            placeholderTextColor={colors.textLight}
                            maxLength={50}
                            autoFocus
                            onSubmitEditing={handleCreateList}
                            testID="create-list-input"
                          />
                          <Pressable onPress={handleCreateList} testID="create-list-confirm">
                            <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.createListOption}
                          onPress={() => setIsCreatingList(true)}
                          testID="create-list-button"
                        >
                          <Ionicons name="add" size={16} color={colors.accent} />
                          <Text style={styles.createListText}>Nouvelle liste</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Ingredient List */}
            {scaledIngredients.length > 0 && (
              <View style={styles.previewContainer} testID="ingredient-preview">
                <ScrollView
                  style={styles.ingredientScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {scaledIngredients.map((ing, i) => (
                    <Pressable
                      key={i}
                      style={styles.ingredientCheckRow}
                      onPress={() => toggleIngredient(i)}
                      testID={`ingredient-check-${i}`}
                    >
                      <Text
                        style={[
                          styles.ingredientCheckText,
                          excludedIndices.has(i) && styles.ingredientCheckTextExcluded,
                        ]}
                        numberOfLines={1}
                      >
                        {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
                      </Text>
                      <Ionicons
                        name={excludedIndices.has(i) ? 'square-outline' : 'checkbox'}
                        size={20}
                        color={excludedIndices.has(i) ? colors.textLight : colors.accent}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
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
                <Text style={styles.primaryButtonText}>Ajouter</Text>
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
    gap: spacing.sm,
  },
  stepperButton: {
    width: 28,
    height: 28,
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
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    minWidth: 24,
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
  ingredientScroll: {
    maxHeight: 150,
  },
  ingredientCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  ingredientCheckText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  ingredientCheckTextExcluded: {
    color: colors.textLight,
    textDecorationLine: 'line-through',
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
  listPickerContainer: {
    zIndex: 10,
    marginBottom: spacing.sm,
  },
  listPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 180,
  },
  listPickerText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  listPickerDropdown: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    minWidth: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  listPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  listPickerItemSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  listPickerItemText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  listPickerItemTextSelected: {
    fontWeight: '600',
  },
  createListOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  createListText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '500',
  },
  createListInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  createListTextInput: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    paddingVertical: spacing.xs,
  },
});
