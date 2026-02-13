import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
} from '../../src/components/shopping';
import type { ListViewTab } from '../../src/components/shopping';
import {
  useActiveShoppingList,
  useShoppingListRecipes,
  useShoppingListItems,
  useToggleItem,
  useAddManualItem,
} from '../../src/hooks/useShoppingList';

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { highlightRecipe } = useLocalSearchParams<{ highlightRecipe?: string }>();
  const [activeTab, setActiveTab] = useState<ListViewTab>('categories');

  const listQuery = useActiveShoppingList();
  const list = listQuery.data;

  const recipesQuery = useShoppingListRecipes(list?.id ?? '');
  const itemsQuery = useShoppingListItems(list?.id ?? '');

  const toggleItem = useToggleItem();
  const addManualItem = useAddManualItem();

  const handleToggle = useCallback(
    (itemId: string) => {
      toggleItem.mutate(itemId);
    },
    [toggleItem]
  );

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
      <Text style={styles.headerTitle}>Liste de course</Text>
      <RecipeCarousel recipes={recipes} highlightRecipeId={highlightRecipe} />
      <SummaryBadges list={list!} />
      <Text style={styles.listTitle}>Liste de course</Text>
      <ListViewTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <View style={styles.listContainer}>
        {activeTab === 'categories' && (
          <CategoryView
            items={items}
            onToggleItem={handleToggle}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
          />
        )}
        {activeTab === 'recipe' && (
          <RecipeView
            items={items}
            recipes={recipes}
            onToggleItem={handleToggle}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
          />
        )}
        {activeTab === 'unsorted' && (
          <UnsortedView
            items={items}
            onToggleItem={handleToggle}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
          />
        )}
      </View>
      <AddIngredientButton onAdd={handleAddManual} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
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
