import { FlatList, StyleSheet } from 'react-native';
import { IngredientRow } from './IngredientRow';
import { spacing } from '../../theme';
import type { ShoppingListItem } from '../../types';

interface UnsortedViewProps {
  items: ShoppingListItem[];
  onToggleItem: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (item: ShoppingListItem) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function sortAlphabetically(items: ShoppingListItem[]): ShoppingListItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function UnsortedView({
  items,
  onToggleItem,
  onDeleteItem,
  onEditItem,
  onRefresh,
  refreshing,
}: UnsortedViewProps) {
  const sorted = sortAlphabetically(items);

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <IngredientRow
          item={item}
          onToggle={onToggleItem}
          onDelete={onDeleteItem}
          onEdit={onEditItem}
        />
      )}
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
