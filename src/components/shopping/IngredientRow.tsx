import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import type { ShoppingListItem } from '../../types';

interface IngredientRowProps {
  item: ShoppingListItem;
  onToggle: (itemId: string) => void;
}

function formatQuantity(item: ShoppingListItem): string | null {
  if (item.quantity == null) return null;
  const parts: string[] = [String(item.quantity)];
  if (item.unit) parts.push(item.unit);
  return parts.join(' ');
}

export function IngredientRow({ item, onToggle }: IngredientRowProps) {
  const quantityText = formatQuantity(item);

  return (
    <Pressable
      style={styles.row}
      onPress={() => onToggle(item.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.isChecked }}
      testID={`ingredient-row-${item.id}`}
    >
      <Text style={[styles.name, item.isChecked && styles.checkedText]} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.rightSection}>
        {quantityText && (
          <Text
            style={[styles.quantity, item.isChecked && styles.checkedText]}
            testID={`ingredient-qty-${item.id}`}
          >
            {quantityText}
          </Text>
        )}
        <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
          {item.isChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  name: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantity: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
});
