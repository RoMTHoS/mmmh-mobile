import { useRef } from 'react';
import { Pressable, Text, View, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import type { ShoppingListItem } from '../../types';

interface IngredientRowProps {
  item: ShoppingListItem;
  onToggle: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  onEdit?: (item: ShoppingListItem) => void;
}

function formatQuantity(item: ShoppingListItem): string | null {
  if (item.quantity == null) return null;
  const parts: string[] = [String(item.quantity)];
  if (item.unit) parts.push(item.unit);
  return parts.join(' ');
}

function renderRightActions(
  _progress: Animated.AnimatedInterpolation<number>,
  dragX: Animated.AnimatedInterpolation<number>
) {
  const scale = dragX.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.deleteAction} testID="swipe-delete-action">
      <Animated.Text style={[styles.deleteText, { transform: [{ scale }] }]}>
        Supprimer
      </Animated.Text>
    </View>
  );
}

function SwipeableWrapper({
  itemId,
  onDelete,
  children,
}: {
  itemId: string;
  onDelete: (itemId: string) => void;
  children: React.ReactNode;
}) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipeOpen = () => {
    swipeableRef.current?.close();
    onDelete(itemId);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      rightThreshold={80}
      testID={`swipeable-${itemId}`}
    >
      {children}
    </Swipeable>
  );
}

export function IngredientRow({ item, onToggle, onDelete, onEdit }: IngredientRowProps) {
  const quantityText = formatQuantity(item);

  const row = (
    <Pressable
      style={styles.row}
      onPress={() => onToggle(item.id)}
      onLongPress={onEdit ? () => onEdit(item) : undefined}
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

  if (!onDelete) return row;

  return (
    <SwipeableWrapper itemId={item.id} onDelete={onDelete}>
      {row}
    </SwipeableWrapper>
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
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
