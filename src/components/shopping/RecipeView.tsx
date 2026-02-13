import { SectionList, Text, StyleSheet } from 'react-native';
import { IngredientRow } from './IngredientRow';
import { colors, typography, spacing } from '../../theme';
import type { ShoppingListItem, ShoppingListRecipe } from '../../types';

interface RecipeViewProps {
  items: ShoppingListItem[];
  recipes: ShoppingListRecipe[];
  onToggleItem: (itemId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface RecipeSection {
  title: string;
  data: ShoppingListItem[];
}

function groupByRecipe(items: ShoppingListItem[], recipes: ShoppingListRecipe[]): RecipeSection[] {
  const recipeMap = new Map<string, string>();
  for (const r of recipes) {
    recipeMap.set(r.recipeId, r.recipeTitle ?? 'Recette inconnue');
  }

  const groups: Record<string, ShoppingListItem[]> = {};
  const manualItems: ShoppingListItem[] = [];

  for (const item of items) {
    if (item.sourceType === 'manual') {
      manualItems.push(item);
      continue;
    }

    // Use first source recipe ID as grouping key
    const recipeId = item.sourceRecipeIds?.[0] ?? 'unknown';
    if (!groups[recipeId]) groups[recipeId] = [];
    groups[recipeId].push(item);
  }

  const sections: RecipeSection[] = [];

  // Recipe sections in order of the recipes list
  for (const recipe of recipes) {
    const recipeItems = groups[recipe.recipeId];
    if (recipeItems && recipeItems.length > 0) {
      sections.push({
        title: recipeMap.get(recipe.recipeId) ?? 'Recette inconnue',
        data: recipeItems,
      });
    }
  }

  // Manual items at bottom
  if (manualItems.length > 0) {
    sections.push({
      title: 'Ajouts manuels',
      data: manualItems,
    });
  }

  return sections;
}

export function RecipeView({
  items,
  recipes,
  onToggleItem,
  onRefresh,
  refreshing,
}: RecipeViewProps) {
  const sections = groupByRecipe(items, recipes);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <IngredientRow item={item} onToggle={onToggleItem} />}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title} :</Text>
      )}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.content}
      onRefresh={onRefresh}
      refreshing={refreshing ?? false}
      testID="recipe-view"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
});
