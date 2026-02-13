import { FlatList, StyleSheet } from 'react-native';
import { IngredientRow } from './IngredientRow';
import { spacing } from '../../theme';
import type { ShoppingListItem } from '../../types';

interface UnsortedViewProps {
  items: ShoppingListItem[];
  onToggleItem: (itemId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function sortAlphabetically(items: ShoppingListItem[]): ShoppingListItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function UnsortedView({ items, onToggleItem, onRefresh, refreshing }: UnsortedViewProps) {
  const sorted = sortAlphabetically(items);

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <IngredientRow item={item} onToggle={onToggleItem} />}
      contentContainerStyle={styles.content}
      onRefresh={onRefresh}
      refreshing={refreshing ?? false}
      testID="unsorted-view"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
});
