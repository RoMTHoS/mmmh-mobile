import { SectionList, Text, StyleSheet } from 'react-native';
import { IngredientRow } from './IngredientRow';
import { colors, typography, spacing } from '../../theme';
import type { ShoppingListItem, IngredientCategoryCode } from '../../types';
import { INGREDIENT_CATEGORIES } from '../../types';

interface CategoryViewProps {
  items: ShoppingListItem[];
  onToggleItem: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (item: ShoppingListItem) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface CategorySection {
  title: string;
  data: ShoppingListItem[];
}

function groupByCategory(items: ShoppingListItem[]): CategorySection[] {
  const groups: Record<string, ShoppingListItem[]> = {};

  for (const item of items) {
    const key = item.category ?? 'other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  // Order by category definition order
  const orderedKeys = Object.keys(INGREDIENT_CATEGORIES) as IngredientCategoryCode[];

  return orderedKeys
    .filter((key) => groups[key] && groups[key].length > 0)
    .map((key) => ({
      title: INGREDIENT_CATEGORIES[key],
      data: groups[key],
    }));
}

export function CategoryView({
  items,
  onToggleItem,
  onDeleteItem,
  onEditItem,
  onRefresh,
  refreshing,
}: CategoryViewProps) {
  const sections = groupByCategory(items);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <IngredientRow
          item={item}
          onToggle={onToggleItem}
          onDelete={onDeleteItem}
          onEdit={onEditItem}
        />
      )}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title} :</Text>
      )}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.content}
      onRefresh={onRefresh}
      refreshing={refreshing ?? false}
      testID="category-view"
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
