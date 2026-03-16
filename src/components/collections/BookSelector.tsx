import { useState } from 'react';
import { Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';
import { useCollectionStore } from '../../stores/collectionStore';

interface BookSelectorProps {
  selectedBookId: string | null;
  onSelect: (bookId: string | null) => void;
}

export function BookSelector({ selectedBookId, onSelect }: BookSelectorProps) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const collections = useCollectionStore((s) => s.collections);
  const recipeBooks = collections.filter((c) => c.type === 'recipeBook');

  const selectedBook = recipeBooks.find((b) => b.id === selectedBookId);
  const displayName = selectedBook?.name ?? 'Toutes les recettes';

  const handleSelect = (bookId: string | null) => {
    onSelect(bookId);
    setDropdownVisible(false);
  };

  const renderItem = ({ item }: { item: { id: string | null; name: string } }) => {
    const isSelected = item.id === selectedBookId;
    return (
      <Pressable
        style={[styles.listItem, isSelected && styles.listItemSelected]}
        onPress={() => handleSelect(item.id)}
      >
        <Text
          style={[styles.listItemText, isSelected && styles.listItemTextSelected]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {isSelected && <Ionicons name="checkmark" size={18} color={colors.accent} />}
      </Pressable>
    );
  };

  const data: { id: string | null; name: string }[] = [
    { id: null, name: 'Toutes les recettes' },
    ...recipeBooks.map((b) => ({ id: b.id as string | null, name: b.name })),
  ];

  return (
    <>
      <Pressable style={styles.selectorButton} onPress={() => setDropdownVisible(true)}>
        <Text style={styles.selectorText} numberOfLines={1}>
          {displayName}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.text} />
      </Pressable>

      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setDropdownVisible(false)}>
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <Text style={styles.dropdownTitle}>Mes livres de recette</Text>
            <FlatList
              data={data}
              keyExtractor={(item) => item.id ?? 'all'}
              renderItem={renderItem}
              style={styles.listContainer}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  selectorText: {
    ...typography.sectionTitle,
    color: colors.text,
    maxWidth: 250,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: spacing.md,
  },
  dropdown: {
    backgroundColor: colors.modalBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    padding: spacing.md,
    maxHeight: 400,
  },
  dropdownTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  listContainer: {
    maxHeight: 300,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  listItemSelected: {
    backgroundColor: colors.surface,
  },
  listItemText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  listItemTextSelected: {
    fontWeight: '600',
  },
});
