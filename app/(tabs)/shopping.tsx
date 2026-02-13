import { useState, useCallback } from 'react';
import { View, Text, Pressable, Alert, Share, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../src/theme';
import { LoadingScreen } from '../../src/components/ui/LoadingScreen';
import {
  RecipeCarousel,
  SummaryBadges,
  ListViewTabs,
  CategoryView,
  RecipeView,
  UnsortedView,
  ShoppingEmptyState,
  AddIngredientButton,
  EditIngredientModal,
} from '../../src/components/shopping';
import type { ListViewTab } from '../../src/components/shopping';
import {
  useActiveShoppingList,
  useShoppingListRecipes,
  useShoppingListItems,
  useToggleItem,
  useAddManualItem,
  useClearCheckedItems,
  useDeleteItem,
  useUpdateItem,
  useRemoveRecipeFromList,
} from '../../src/hooks/useShoppingList';
import { exportShoppingListAsText } from '../../src/utils/shoppingListExport';
import type { ShoppingListItem, ShoppingListRecipe } from '../../src/types';

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { highlightRecipe } = useLocalSearchParams<{ highlightRecipe?: string }>();
  const [activeTab, setActiveTab] = useState<ListViewTab>('categories');
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);

  const listQuery = useActiveShoppingList();
  const list = listQuery.data;

  const recipesQuery = useShoppingListRecipes(list?.id ?? '');
  const itemsQuery = useShoppingListItems(list?.id ?? '');

  const toggleItem = useToggleItem();
  const addManualItem = useAddManualItem();
  const clearChecked = useClearCheckedItems();
  const deleteItem = useDeleteItem();
  const updateItem = useUpdateItem();
  const removeRecipe = useRemoveRecipeFromList();

  const handleToggle = useCallback(
    (itemId: string) => {
      toggleItem.mutate(itemId);
    },
    [toggleItem]
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (!list) return;
      deleteItem.mutate({ itemId, listId: list.id });
    },
    [list, deleteItem]
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
      if (!list) return;
      updateItem.mutate({
        itemId,
        listId: list.id,
        updates,
        convertToManual,
      });
    },
    [list, updateItem]
  );

  const handleClearChecked = useCallback(() => {
    if (!list) return;
    const checkedCount = (itemsQuery.data ?? []).filter((i) => i.isChecked).length;
    if (checkedCount === 0) return;

    Alert.alert(
      'Effacer les cochés',
      `Supprimer ${checkedCount} élément${checkedCount > 1 ? 's' : ''} coché${checkedCount > 1 ? 's' : ''} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => clearChecked.mutate(list.id),
        },
      ]
    );
  }, [list, itemsQuery.data, clearChecked]);

  const handleRemoveRecipe = useCallback(
    (recipe: ShoppingListRecipe) => {
      if (!list) return;

      Alert.alert(
        'Retirer la recette',
        `Retirer ${recipe.recipeTitle ?? 'cette recette'} ? Tous les ingrédients associés seront supprimés.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Retirer',
            style: 'destructive',
            onPress: async () => {
              removeRecipe.mutate({ listId: list.id, recipeId: recipe.recipeId });
            },
          },
        ]
      );
    },
    [list, removeRecipe]
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
      if (!list) return;
      addManualItem.mutate({
        listId: list.id,
        name: params.name,
        quantity: params.quantity,
        unit: params.unit,
        category: params.category,
      });
    },
    [list, addManualItem]
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
  const checkedCount = items.filter((i) => i.isChecked).length;

  // Empty state
  if (recipes.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Liste de course</Text>
        <ShoppingEmptyState />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="shopping-screen">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liste de course</Text>
        <View style={styles.headerActions}>
          {checkedCount > 0 && (
            <Pressable
              onPress={handleClearChecked}
              style={styles.headerButton}
              testID="clear-checked-button"
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          )}
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
      <SummaryBadges list={list!} />
      <Text style={styles.listTitle}>Liste de course</Text>
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
  listTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
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
