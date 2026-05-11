import { useState, useMemo } from 'react';
import { Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
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

  const recipeBooks = useMemo(
    () => collections.filter((c) => c.type === 'recipeBook'),
    [collections]
  );
  const menus = useMemo(() => collections.filter((c) => c.type === 'menu'), [collections]);

  const selectedCollection = collections.find((c) => c.id === selectedBookId);
  const displayName = selectedCollection?.name ?? 'Toutes les recettes';

  const handleSelect = (id: string | null) => {
    onSelect(id);
    setDropdownVisible(false);
  };

  const renderItem = (item: { id: string | null; name: string }) => {
    const isSelected = item.id === selectedBookId;
    return (
      <Pressable
        key={item.id ?? 'all'}
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
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
              {/* All recipes option */}
              {renderItem({ id: null, name: 'Toutes les recettes' })}

              {/* Livre de recette section */}
              <Text style={styles.sectionTitle}>Livre de recette</Text>
              {recipeBooks.length > 0 ? (
                recipeBooks.map((b) => renderItem({ id: b.id, name: b.name }))
              ) : (
                <Text style={styles.emptyText}>Aucun livre créé</Text>
              )}

              {/* Regime & Menu section */}
              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Plans de repas</Text>
              {menus.length > 0 ? (
                menus.map((m) => renderItem({ id: m.id, name: m.name }))
              ) : (
                <Text style={styles.emptyText}>Aucun plan de repas créé</Text>
              )}
            </ScrollView>
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
  scrollContainer: {
    maxHeight: 350,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sectionTitleSpaced: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
