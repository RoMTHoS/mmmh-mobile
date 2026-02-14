import { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, TextInput, Alert, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';
import {
  useShoppingLists,
  useCreateShoppingList,
  useRenameShoppingList,
  useDeleteShoppingList,
  useArchiveShoppingList,
  useReactivateShoppingList,
} from '../../hooks/useShoppingList';
import { useShoppingStore } from '../../stores/shoppingStore';
import type { ShoppingList } from '../../types';

const MAX_LISTS = 10;
const MAX_NAME_LENGTH = 50;

interface ListSelectorProps {
  activeListId: string;
}

export function ListSelector({ activeListId }: ListSelectorProps) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeListsQuery = useShoppingLists(true);
  const allListsQuery = useShoppingLists(false);
  const createMutation = useCreateShoppingList();
  const renameMutation = useRenameShoppingList();
  const deleteMutation = useDeleteShoppingList();
  const archiveMutation = useArchiveShoppingList();
  const reactivateMutation = useReactivateShoppingList();

  const setActiveListId = useShoppingStore((s) => s.setActiveListId);

  const activeLists = activeListsQuery.data ?? [];
  const allLists = allListsQuery.data ?? [];
  const archivedLists = allLists.filter((l) => !l.isActive);
  const activeList = activeLists.find((l) => l.id === activeListId);

  const handleSelectList = useCallback(
    (listId: string) => {
      setActiveListId(listId);
      setDropdownVisible(false);
    },
    [setActiveListId]
  );

  const handleCreate = useCallback(() => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_NAME_LENGTH) return;

    const duplicate = activeLists.some((l) => l.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      Alert.alert('Nom déjà utilisé', 'Une liste avec ce nom existe déjà.');
      return;
    }

    createMutation.mutate(trimmed, {
      onSuccess: (newList) => {
        setActiveListId(newList.id);
        setCreateMode(false);
        setNewListName('');
        setDropdownVisible(false);
      },
    });
  }, [newListName, activeLists, createMutation, setActiveListId]);

  const handleRename = useCallback(
    (listId: string) => {
      const trimmed = renameValue.trim();
      if (!trimmed || trimmed.length > MAX_NAME_LENGTH) return;

      renameMutation.mutate(
        { listId, name: trimmed },
        {
          onSuccess: () => {
            setRenamingListId(null);
            setRenameValue('');
          },
        }
      );
    },
    [renameValue, renameMutation]
  );

  const handleDelete = useCallback(
    (list: ShoppingList) => {
      Alert.alert('Supprimer la liste', `Supprimer ${list.name} ? Cette action est irréversible.`, [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(list.id, {
              onSuccess: () => {
                // Switch to default list after deletion
                const defaultList = activeLists.find((l) => l.isDefault);
                if (defaultList && activeListId === list.id) {
                  setActiveListId(defaultList.id);
                }
              },
            });
          },
        },
      ]);
    },
    [deleteMutation, activeLists, activeListId, setActiveListId]
  );

  const handleArchive = useCallback(
    (list: ShoppingList) => {
      archiveMutation.mutate(list.id, {
        onSuccess: () => {
          const defaultList = activeLists.find((l) => l.isDefault);
          if (defaultList && activeListId === list.id) {
            setActiveListId(defaultList.id);
          }
        },
      });
    },
    [archiveMutation, activeLists, activeListId, setActiveListId]
  );

  const handleReactivate = useCallback(
    (listId: string) => {
      reactivateMutation.mutate(listId, {
        onError: (error) => {
          Alert.alert('Erreur', error.message);
        },
      });
    },
    [reactivateMutation]
  );

  const showContextMenu = useCallback(
    (list: ShoppingList) => {
      const options: { text: string; onPress: () => void; style?: 'destructive' | 'cancel' }[] = [
        {
          text: 'Renommer',
          onPress: () => {
            setRenamingListId(list.id);
            setRenameValue(list.name);
          },
        },
      ];

      if (!list.isDefault) {
        options.push({
          text: 'Archiver',
          onPress: () => handleArchive(list),
        });
        options.push({
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => handleDelete(list),
        });
      }

      options.push({ text: 'Annuler', onPress: () => {}, style: 'cancel' });

      Alert.alert(list.name, undefined, options);
    },
    [handleArchive, handleDelete]
  );

  const canCreate = activeLists.length < MAX_LISTS;

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const isSelected = item.id === activeListId;

    if (renamingListId === item.id) {
      return (
        <View style={styles.renameRow} testID={`rename-row-${item.id}`}>
          <TextInput
            style={styles.renameInput}
            value={renameValue}
            onChangeText={setRenameValue}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            testID="rename-input"
          />
          <Pressable onPress={() => handleRename(item.id)} testID="rename-confirm">
            <Ionicons name="checkmark" size={20} color={colors.success} />
          </Pressable>
          <Pressable
            onPress={() => {
              setRenamingListId(null);
              setRenameValue('');
            }}
            testID="rename-cancel"
          >
            <Ionicons name="close" size={20} color={colors.error} />
          </Pressable>
        </View>
      );
    }

    return (
      <Pressable
        style={[styles.listItem, isSelected && styles.listItemSelected]}
        onPress={() => handleSelectList(item.id)}
        onLongPress={() => showContextMenu(item)}
        testID={`list-item-${item.id}`}
      >
        <View style={styles.listItemContent}>
          <Text
            style={[styles.listItemText, isSelected && styles.listItemTextSelected]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.mealCount > 0 && <Text style={styles.listItemCount}>{item.mealCount} repas</Text>}
        </View>
        {isSelected && <Ionicons name="checkmark" size={18} color={colors.accent} />}
      </Pressable>
    );
  };

  const renderArchivedItem = ({ item }: { item: ShoppingList }) => (
    <Pressable
      style={styles.archivedItem}
      onPress={() => handleReactivate(item.id)}
      testID={`archived-item-${item.id}`}
    >
      <Text style={styles.archivedItemText} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.reactivateText}>Réactiver</Text>
    </Pressable>
  );

  return (
    <>
      <Pressable
        style={styles.selectorButton}
        onPress={() => setDropdownVisible(true)}
        testID="list-selector-button"
      >
        <Text style={styles.selectorText} numberOfLines={1}>
          {activeList?.name ?? 'Liste de courses'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.text} />
      </Pressable>

      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setDropdownVisible(false);
            setCreateMode(false);
            setRenamingListId(null);
          }}
        >
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <Text style={styles.dropdownTitle}>Mes listes</Text>

            <FlatList
              data={activeLists}
              keyExtractor={(item) => item.id}
              renderItem={renderListItem}
              style={styles.listContainer}
              testID="active-lists"
            />

            {/* Create new list */}
            {createMode ? (
              <View style={styles.createRow} testID="create-row">
                <TextInput
                  style={styles.createInput}
                  placeholder="Nom de la liste"
                  placeholderTextColor={colors.textLight}
                  value={newListName}
                  onChangeText={setNewListName}
                  maxLength={MAX_NAME_LENGTH}
                  autoFocus
                  testID="create-input"
                />
                <Pressable
                  onPress={handleCreate}
                  disabled={!newListName.trim()}
                  testID="create-confirm"
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={newListName.trim() ? colors.accent : colors.textLight}
                  />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
                onPress={() => canCreate && setCreateMode(true)}
                disabled={!canCreate}
                testID="new-list-button"
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={canCreate ? colors.accent : colors.textLight}
                />
                <Text
                  style={[styles.createButtonText, !canCreate && styles.createButtonTextDisabled]}
                >
                  {canCreate ? '+ Nouvelle liste' : 'Maximum 10 listes atteint'}
                </Text>
              </Pressable>
            )}

            {/* Archived section */}
            {archivedLists.length > 0 && (
              <View style={styles.archivedSection}>
                <Pressable
                  style={styles.archivedHeader}
                  onPress={() => setShowArchived(!showArchived)}
                  testID="archived-toggle"
                >
                  <Text style={styles.archivedHeaderText}>
                    Listes archivées ({archivedLists.length})
                  </Text>
                  <Ionicons
                    name={showArchived ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textMuted}
                  />
                </Pressable>
                {showArchived && (
                  <FlatList
                    data={archivedLists}
                    keyExtractor={(item) => item.id}
                    renderItem={renderArchivedItem}
                    testID="archived-lists"
                  />
                )}
              </View>
            )}
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
    paddingVertical: spacing.xs,
  },
  selectorText: {
    ...typography.sectionTitle,
    color: colors.text,
    maxWidth: 200,
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
    maxHeight: 500,
  },
  dropdownTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  listContainer: {
    maxHeight: 250,
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
  listItemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listItemText: {
    ...typography.body,
    color: colors.text,
  },
  listItemTextSelected: {
    fontWeight: '600',
  },
  listItemCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  renameInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  createInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    ...typography.body,
    color: colors.accent,
  },
  createButtonTextDisabled: {
    color: colors.textLight,
  },
  archivedSection: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: spacing.sm,
  },
  archivedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  archivedHeaderText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  archivedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  archivedItemText: {
    ...typography.body,
    color: colors.textLight,
    flex: 1,
  },
  reactivateText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
});
