import { useState, useEffect, useRef } from 'react';
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
import { Toast } from '../../utils/toast';
import { Icon } from '../ui';
import {
  useAddRecipeToList,
  useShoppingLists,
  useActiveShoppingList,
  useCreateShoppingList,
} from '../../hooks/useShoppingList';
import { colors, typography, spacing, radius } from '../../theme';
import type { Recipe } from '../../types/recipe';

interface MenuRecipeEntry {
  recipe: Recipe;
  servings: number;
}

interface MenuToShoppingModalProps {
  visible: boolean;
  onClose: () => void;
  recipes: MenuRecipeEntry[];
}

export function MenuToShoppingModal({ visible, onClose, recipes }: MenuToShoppingModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const addMutation = useAddRecipeToList();
  const createListMutation = useCreateShoppingList();
  const listsQuery = useShoppingLists(true);
  const activeListQuery = useActiveShoppingList();
  const lists = listsQuery.data ?? [];
  const defaultListId = activeListQuery.data?.id ?? '';

  const [selectedListId, setSelectedListId] = useState(defaultListId);
  const [listPickerVisible, setListPickerVisible] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const selectedList = lists.find((l) => l.id === selectedListId);

  useEffect(() => {
    if (visible) {
      setSelectedListId(defaultListId);
      setListPickerVisible(false);
      setIsCreatingList(false);
      setNewListName('');
      setIsAdding(false);

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
  }, [visible, defaultListId, slideAnim, backdropAnim]);

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

  const handleAddAll = async () => {
    if (!selectedListId || recipes.length === 0) return;
    setIsAdding(true);
    try {
      for (const entry of recipes) {
        const baseServings = entry.recipe.servings ?? 4;
        const wantedServings = entry.servings;
        const multiplier = baseServings > 0 ? wantedServings / baseServings : 1;
        await addMutation.mutateAsync({
          listId: selectedListId,
          recipeId: entry.recipe.id,
          servingsMultiplier: multiplier,
        });
      }
      Toast.show({
        type: 'success',
        text1: `${recipes.length} recettes ajoutées à la liste`,
      });
      handleClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: "Erreur lors de l'ajout",
      });
    } finally {
      setIsAdding(false);
    }
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
            <Text style={styles.title}>Ajouter à une liste de courses</Text>

            {/* List Picker */}
            <View style={styles.listPickerContainer}>
              <View style={styles.listPickerRow}>
                <Text style={styles.label}>Liste</Text>
                <View>
                  <Pressable
                    style={styles.listPickerButton}
                    onPress={() => {
                      setListPickerVisible(!listPickerVisible);
                      setIsCreatingList(false);
                      setNewListName('');
                    }}
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
                    <View style={styles.listPickerDropdown}>
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
                          />
                          <Pressable onPress={handleCreateList}>
                            <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.createListOption}
                          onPress={() => setIsCreatingList(true)}
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

            {/* Recipe List */}
            <View style={styles.recipeListContainer}>
              <ScrollView
                style={styles.recipeScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {recipes.map((entry) => (
                  <View key={entry.recipe.id} style={styles.recipeRow}>
                    <Text style={styles.recipeTitle} numberOfLines={1}>
                      {entry.recipe.title}
                    </Text>
                    <View style={styles.servingsBadge}>
                      <Ionicons name="person-outline" size={12} color={colors.text} />
                      <Text style={styles.servingsText}>{entry.servings}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Add Button */}
            <Pressable
              style={[styles.addButton, isAdding && styles.addButtonDisabled]}
              onPress={handleAddAll}
              disabled={isAdding || !selectedListId}
            >
              <Icon name="cart-add" size="md" color="#FFFFFF" />
              <Text style={styles.addButtonText}>
                {isAdding ? 'Ajout en cours...' : `Ajouter ${recipes.length} recettes`}
              </Text>
              <Icon name="cart-add" size="md" color="#FFFFFF" />
            </Pressable>
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
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  listPickerContainer: {
    zIndex: 10,
    marginBottom: spacing.md,
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
  recipeListContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  recipeScroll: {
    maxHeight: 200,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  recipeTitle: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  servingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  servingsText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
