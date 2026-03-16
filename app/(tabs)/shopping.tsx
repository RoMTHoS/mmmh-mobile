import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, Alert, Share, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../src/theme';
import { LoadingScreen } from '../../src/components/ui/LoadingScreen';
import {
  RecipeCarousel,
  ListViewTabs,
  CategoryView,
  RecipeView,
  UnsortedView,
  ShoppingEmptyState,
  AddIngredientButton,
  EditIngredientModal,
  ListSelector,
} from '../../src/components/shopping';
import type { ListViewTab } from '../../src/components/shopping';
import {
  useActiveShoppingList,
  useShoppingListRecipes,
  useShoppingListItems,
  useToggleItem,
  useAddManualItem,
  useDeleteItem,
  useUpdateItem,
  useRemoveRecipeFromList,
  useDeleteShoppingList,
  useShoppingLists,
} from '../../src/hooks/useShoppingList';
import { useShoppingStore } from '../../src/stores/shoppingStore';
import { exportShoppingListAsText } from '../../src/utils/shoppingListExport';
import type { ShoppingListItem, ShoppingListRecipe } from '../../src/types';

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { highlightRecipe } = useLocalSearchParams<{ highlightRecipe?: string }>();
  const [activeTab, setActiveTab] = useState<ListViewTab>('categories');
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);

  const activeListId = useShoppingStore((s) => s.activeListId);
  const setActiveListId = useShoppingStore((s) => s.setActiveListId);

  const listQuery = useActiveShoppingList();
  const defaultList = listQuery.data;

  // Resolve the effective list ID: store value, or fallback to default list
  const effectiveListId = activeListId ?? defaultList?.id ?? '';

  // Set activeListId in store on first load if not set
  useEffect(() => {
    if (!activeListId && defaultList?.id) {
      setActiveListId(defaultList.id);
    }
  }, [activeListId, defaultList?.id, setActiveListId]);

  const recipesQuery = useShoppingListRecipes(effectiveListId);
  const itemsQuery = useShoppingListItems(effectiveListId);
  const listsQuery = useShoppingLists(true);

  const toggleItem = useToggleItem();
  const addManualItem = useAddManualItem();
  const deleteItem = useDeleteItem();
  const updateItem = useUpdateItem();
  const removeRecipe = useRemoveRecipeFromList();
  const deleteList = useDeleteShoppingList();

  const handleToggle = useCallback(
    (itemId: string) => {
      toggleItem.mutate(itemId);
    },
    [toggleItem]
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (!effectiveListId) return;
      deleteItem.mutate({ itemId, listId: effectiveListId });
    },
    [effectiveListId, deleteItem]
  );

  const handleEditItem = useCallback((item: ShoppingListItem) => {
    setEditingItem(item);
  }, []);

  const handleSaveEdit = useCallback(
    (
      itemId: string,
      updates: Partial<Pick<ShoppingListItem, 'name' | 'quantity' | 'unit' | 'category'>>,
      convertToManual: boolean
    ) => {
      if (!effectiveListId) return;
      updateItem.mutate({
        itemId,
        listId: effectiveListId,
        updates,
        convertToManual,
      });
    },
    [effectiveListId, updateItem]
  );

  const handleDeleteList = useCallback(() => {
    if (!effectiveListId) return;
    // Find the current list to check if it's the default
    const currentList = (listsQuery?.data ?? []).find((l) => l.id === effectiveListId);
    if (currentList?.isDefault) {
      Alert.alert('Liste par défaut', 'La liste par défaut ne peut pas être supprimée.');
      return;
    }

    Alert.alert(
      'Supprimer la liste',
      'Supprimer cette liste et tous ses ingrédients ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteList.mutate(effectiveListId, {
              onSuccess: () => {
                // Switch back to default list
                const defaultId = defaultList?.id;
                if (defaultId) setActiveListId(defaultId);
              },
            });
          },
        },
      ]
    );
  }, [effectiveListId, deleteList, defaultList?.id, setActiveListId]);

  const handleRemoveRecipe = useCallback(
    (recipe: ShoppingListRecipe) => {
      if (!effectiveListId) return;

      Alert.alert(
        'Retirer la recette',
        `Retirer ${recipe.recipeTitle ?? 'cette recette'} ? Tous les ingrédients associés seront supprimés.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Retirer',
            style: 'destructive',
            onPress: async () => {
              removeRecipe.mutate({ listId: effectiveListId, recipeId: recipe.recipeId });
            },
          },
        ]
      );
    },
    [effectiveListId, removeRecipe]
  );

  const handleShare = useCallback(async () => {
    const items = itemsQuery.data ?? [];
    const recipes = recipesQuery.data ?? [];
    if (items.length === 0) return;

    const text = exportShoppingListAsText(items, recipes.length);
    try {
      await Share.share({ message: text });
    } catch {
      // User cancelled share
    }
  }, [itemsQuery.data, recipesQuery.data]);

  const handleAddManual = useCallback(
    (params: {
      name: string;
      quantity?: number;
      unit?: string;
      category?: 'produce' | 'dairy' | 'meat' | 'seafood' | 'pantry' | 'frozen' | 'other';
    }) => {
      if (!effectiveListId) return;
      addManualItem.mutate({
        listId: effectiveListId,
        name: params.name,
        quantity: params.quantity,
        unit: params.unit,
        category: params.category,
      });
    },
    [effectiveListId, addManualItem]
  );

  const handleRefresh = useCallback(() => {
    recipesQuery.refetch();
    itemsQuery.refetch();
  }, [recipesQuery, itemsQuery]);

  const isRefreshing = recipesQuery.isFetching || itemsQuery.isFetching;

  // Loading state
  if (listQuery.isLoading) {
    return <LoadingScreen />;
  }

  // Error state
  if (listQuery.isError) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]} testID="shopping-error">
        <Text style={styles.errorText}>Impossible de charger la liste</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => listQuery.refetch()}
          testID="retry-button"
        >
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  const recipes = recipesQuery.data ?? [];
  const items = itemsQuery.data ?? [];
  // Empty state
  if (recipes.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <ListSelector activeListId={effectiveListId} />
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleDeleteList}
              style={styles.headerButton}
              testID="delete-list-button"
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          </View>
        </View>
        <ShoppingEmptyState />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="shopping-screen">
      <View style={styles.header}>
        <ListSelector activeListId={effectiveListId} />
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleDeleteList}
            style={styles.headerButton}
            testID="delete-list-button"
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.headerButton} testID="share-button">
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
      <RecipeCarousel
        recipes={recipes}
        highlightRecipeId={highlightRecipe}
        onRemoveRecipe={handleRemoveRecipe}
      />
      <ListViewTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <View style={styles.listContainer}>
        {activeTab === 'categories' && (
          <CategoryView
            items={items}
            onToggleItem={handleToggle}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
          />
        )}
        {activeTab === 'recipe' && (
          <RecipeView
            items={items}
            recipes={recipes}
            onToggleItem={handleToggle}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
          />
        )}
        {activeTab === 'unsorted' && (
          <UnsortedView
            items={items}
            onToggleItem={handleToggle}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
          />
        )}
      </View>
      <AddIngredientButton onAdd={handleAddManual} />
      <EditIngredientModal
        item={editingItem}
        visible={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  listContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  retryText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
