jest.mock('expo-sqlite');
jest.mock('react-native-uuid');

import * as shoppingDb from '../../src/services/shoppingDatabase';
import { resetDatabase } from '../../src/services/database';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SQLiteMock = require('../../__mocks__/expo-sqlite');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const uuidMock = require('../../__mocks__/react-native-uuid');

const mockDatabase = SQLiteMock.__mockDatabase;

describe('Shopping Database Service', () => {
  beforeEach(() => {
    SQLiteMock.__resetMocks();
    uuidMock.__resetCounter();
    resetDatabase();
  });

  describe('createShoppingList', () => {
    it('should create a shopping list with default name', async () => {
      const list = await shoppingDb.createShoppingList();

      expect(list.id).toBe('test-uuid-1');
      expect(list.name).toBe('Ma liste de courses');
      expect(list.isActive).toBe(true);
      expect(list.mealCount).toBe(0);
      expect(list.priceEstimateMin).toBeNull();
      expect(list.priceEstimateMax).toBeNull();
      expect(list.createdAt).toBeDefined();
    });

    it('should create a shopping list with custom name', async () => {
      const list = await shoppingDb.createShoppingList('Courses semaine');

      expect(list.name).toBe('Courses semaine');
      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      const [, params] = mockDatabase.runSync.mock.calls[0];
      expect(params[1]).toBe('Courses semaine');
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('SQLITE_FULL');
      });

      await expect(shoppingDb.createShoppingList()).rejects.toThrow(
        'Impossible de créer la liste de courses. SQLITE_FULL'
      );
    });
  });

  describe('getActiveShoppingList', () => {
    it('should return the active shopping list', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'list-1',
        name: 'Ma liste de courses',
        is_active: 1,
        meal_count: 3,
        price_estimate_min: null,
        price_estimate_max: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      });

      const list = await shoppingDb.getActiveShoppingList();

      expect(list).not.toBeNull();
      expect(list!.id).toBe('list-1');
      expect(list!.isActive).toBe(true);
      expect(list!.mealCount).toBe(3);
    });

    it('should return null when no active list exists', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      const list = await shoppingDb.getActiveShoppingList();

      expect(list).toBeNull();
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.getFirstSync.mockImplementation(() => {
        throw new Error('Database locked');
      });

      await expect(shoppingDb.getActiveShoppingList()).rejects.toThrow(
        'Impossible de charger la liste de courses. Database locked'
      );
    });
  });

  describe('addRecipeToList', () => {
    it('should add a recipe to the list with default servings', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ count: 1 });

      const entry = await shoppingDb.addRecipeToList('list-1', 'recipe-1');

      expect(entry.id).toBe('test-uuid-1');
      expect(entry.shoppingListId).toBe('list-1');
      expect(entry.recipeId).toBe('recipe-1');
      expect(entry.servingsMultiplier).toBe(1.0);
    });

    it('should use UPSERT to handle duplicate recipe', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ count: 1 });

      await shoppingDb.addRecipeToList('list-1', 'recipe-1', 2.0);

      const [sql] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('ON CONFLICT');
      expect(sql).toContain('DO UPDATE SET servings_multiplier');
    });

    it('should update meal count after adding', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ count: 2 });

      await shoppingDb.addRecipeToList('list-1', 'recipe-1');

      // 3 calls: insert, count query, update meal count
      expect(mockDatabase.runSync).toHaveBeenCalledTimes(2);
      const updateCall = mockDatabase.runSync.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE shopping_lists SET meal_count');
      expect(updateCall[1][0]).toBe(2);
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('FOREIGN KEY constraint failed');
      });

      await expect(shoppingDb.addRecipeToList('list-1', 'bad-recipe')).rejects.toThrow(
        "Impossible d'ajouter la recette. FOREIGN KEY constraint failed"
      );
    });
  });

  describe('removeRecipeFromList', () => {
    it('should remove recipe and associated items', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ count: 0 });

      await shoppingDb.removeRecipeFromList('list-1', 'recipe-1');

      // 3 runSync calls: delete items, delete recipe link, update meal count
      expect(mockDatabase.runSync).toHaveBeenCalledTimes(3);
      const [deleteItemsSql] = mockDatabase.runSync.mock.calls[0];
      expect(deleteItemsSql).toContain('DELETE FROM shopping_list_items');
      const [deleteRecipeSql] = mockDatabase.runSync.mock.calls[1];
      expect(deleteRecipeSql).toContain('DELETE FROM shopping_list_recipes');
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('IO Error');
      });

      await expect(shoppingDb.removeRecipeFromList('list-1', 'recipe-1')).rejects.toThrow(
        'Impossible de retirer la recette. IO Error'
      );
    });
  });

  describe('getShoppingListRecipes', () => {
    it('should return recipes with joined data', async () => {
      mockDatabase.getAllSync.mockReturnValue([
        {
          id: 'slr-1',
          shopping_list_id: 'list-1',
          recipe_id: 'recipe-1',
          servings_multiplier: 1.5,
          added_at: '2024-01-01T00:00:00.000Z',
          recipe_title: 'Pasta',
          recipe_photo_uri: 'file://photo.jpg',
        },
      ]);

      const recipes = await shoppingDb.getShoppingListRecipes('list-1');

      expect(recipes).toHaveLength(1);
      expect(recipes[0].recipeId).toBe('recipe-1');
      expect(recipes[0].recipeTitle).toBe('Pasta');
      expect(recipes[0].servingsMultiplier).toBe(1.5);
    });

    it('should return empty array when no recipes in list', async () => {
      mockDatabase.getAllSync.mockReturnValue([]);

      const recipes = await shoppingDb.getShoppingListRecipes('list-1');

      expect(recipes).toEqual([]);
    });
  });

  describe('addManualItem', () => {
    it('should add a manual item with all fields', async () => {
      const item = await shoppingDb.addManualItem('list-1', 'Pain', 2, 'pièces', 'pantry');

      expect(item.id).toBe('test-uuid-1');
      expect(item.name).toBe('Pain');
      expect(item.quantity).toBe(2);
      expect(item.unit).toBe('pièces');
      expect(item.category).toBe('pantry');
      expect(item.sourceType).toBe('manual');
      expect(item.isChecked).toBe(false);
    });

    it('should add a manual item with minimal fields', async () => {
      const item = await shoppingDb.addManualItem('list-1', 'Sel');

      expect(item.name).toBe('Sel');
      expect(item.quantity).toBeNull();
      expect(item.unit).toBeNull();
      expect(item.category).toBe('other');
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('SQLITE_CONSTRAINT');
      });

      await expect(shoppingDb.addManualItem('bad-list', 'Pain')).rejects.toThrow(
        "Impossible d'ajouter l'article. SQLITE_CONSTRAINT"
      );
    });
  });

  describe('toggleItemChecked', () => {
    it('should toggle item checked state', async () => {
      await shoppingDb.toggleItemChecked('item-1');

      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      const [sql] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('CASE WHEN is_checked = 0 THEN 1 ELSE 0 END');
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('Row not found');
      });

      await expect(shoppingDb.toggleItemChecked('bad-id')).rejects.toThrow(
        "Impossible de modifier l'article. Row not found"
      );
    });
  });

  describe('updateItem', () => {
    it('should update item fields', async () => {
      await shoppingDb.updateItem('item-1', { name: 'New Name', quantity: 3 });

      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('name = ?');
      expect(sql).toContain('quantity = ?');
      expect(params[0]).toBe('New Name');
      expect(params[1]).toBe(3);
    });

    it('should do nothing when no updates provided', async () => {
      await shoppingDb.updateItem('item-1', {});

      expect(mockDatabase.runSync).not.toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    it('should mark recipe-sourced item as excluded', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'item-1',
        source_type: 'recipe',
      });

      await shoppingDb.deleteItem('item-1');

      const [sql] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('is_excluded = 1');
    });

    it('should hard-delete manual items', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'item-1',
        source_type: 'manual',
      });

      await shoppingDb.deleteItem('item-1');

      const [sql] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('DELETE FROM shopping_list_items');
    });

    it('should hard-delete when item not found (already deleted)', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      await shoppingDb.deleteItem('item-1');

      const [sql] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('DELETE FROM shopping_list_items');
    });
  });

  describe('clearCheckedItems', () => {
    it('should delete manual checked items and exclude recipe checked items', async () => {
      await shoppingDb.clearCheckedItems('list-1');

      expect(mockDatabase.runSync).toHaveBeenCalledTimes(2);

      const [deleteSql] = mockDatabase.runSync.mock.calls[0];
      expect(deleteSql).toContain('DELETE FROM shopping_list_items');
      expect(deleteSql).toContain("source_type = 'manual'");

      const [updateSql] = mockDatabase.runSync.mock.calls[1];
      expect(updateSql).toContain('is_excluded = 1');
      expect(updateSql).toContain("source_type = 'recipe'");
    });
  });

  describe('getShoppingListItems', () => {
    it('should return non-excluded items ordered by category and name', async () => {
      mockDatabase.getAllSync.mockReturnValue([
        {
          id: 'item-1',
          shopping_list_id: 'list-1',
          name: 'Butter',
          quantity: 200,
          unit: 'g',
          category: 'dairy',
          source_type: 'recipe',
          source_recipe_ids: '["recipe-1"]',
          is_checked: 0,
          is_excluded: 0,
          checked_at: null,
          estimated_price: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ]);

      const items = await shoppingDb.getShoppingListItems('list-1');

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Butter');
      expect(items[0].isChecked).toBe(false);
      expect(items[0].sourceRecipeIds).toEqual(['recipe-1']);

      const [sql] = mockDatabase.getAllSync.mock.calls[0];
      expect(sql).toContain('is_excluded = 0');
      expect(sql).toContain('ORDER BY category ASC, name ASC');
    });

    it('should return empty array when no items', async () => {
      mockDatabase.getAllSync.mockReturnValue([]);

      const items = await shoppingDb.getShoppingListItems('list-1');

      expect(items).toEqual([]);
    });

    it('should deserialize source_recipe_ids JSON', async () => {
      mockDatabase.getAllSync.mockReturnValue([
        {
          id: 'item-1',
          shopping_list_id: 'list-1',
          name: 'Flour',
          quantity: 500,
          unit: 'g',
          category: 'pantry',
          source_type: 'recipe',
          source_recipe_ids: '["recipe-1","recipe-2"]',
          is_checked: 1,
          is_excluded: 0,
          checked_at: '2024-01-01T12:00:00.000Z',
          estimated_price: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ]);

      const items = await shoppingDb.getShoppingListItems('list-1');

      expect(items[0].sourceRecipeIds).toEqual(['recipe-1', 'recipe-2']);
      expect(items[0].isChecked).toBe(true);
    });

    it('should handle null source_recipe_ids for manual items', async () => {
      mockDatabase.getAllSync.mockReturnValue([
        {
          id: 'item-1',
          shopping_list_id: 'list-1',
          name: 'Pain',
          quantity: null,
          unit: null,
          category: 'pantry',
          source_type: 'manual',
          source_recipe_ids: null,
          is_checked: 0,
          is_excluded: 0,
          checked_at: null,
          estimated_price: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ]);

      const items = await shoppingDb.getShoppingListItems('list-1');

      expect(items[0].sourceRecipeIds).toBeNull();
      expect(items[0].sourceType).toBe('manual');
    });
  });

  // --- Multi-list CRUD (Story 4.5) ---

  describe('getAllShoppingLists', () => {
    it('should return only active lists by default', async () => {
      mockDatabase.getAllSync.mockReturnValue([
        {
          id: 'list-1',
          name: 'Ma liste de courses',
          is_active: 1,
          is_default: 1,
          meal_count: 2,
          price_estimate_min: null,
          price_estimate_max: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ]);

      const lists = await shoppingDb.getAllShoppingLists();

      expect(lists).toHaveLength(1);
      expect(lists[0].isDefault).toBe(true);
      const [sql] = mockDatabase.getAllSync.mock.calls[0];
      expect(sql).toContain('WHERE is_active = 1');
    });

    it('should return all lists when activeOnly is false', async () => {
      mockDatabase.getAllSync.mockReturnValue([
        {
          id: 'list-1',
          name: 'Active',
          is_active: 1,
          is_default: 1,
          meal_count: 0,
          price_estimate_min: null,
          price_estimate_max: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'list-2',
          name: 'Archived',
          is_active: 0,
          is_default: 0,
          meal_count: 0,
          price_estimate_min: null,
          price_estimate_max: null,
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
        },
      ]);

      const lists = await shoppingDb.getAllShoppingLists(false);

      expect(lists).toHaveLength(2);
      const [sql] = mockDatabase.getAllSync.mock.calls[0];
      expect(sql).not.toContain('WHERE is_active = 1');
    });
  });

  describe('getShoppingListById', () => {
    it('should return a list by ID', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'list-1',
        name: 'Ma liste',
        is_active: 1,
        is_default: 0,
        meal_count: 0,
        price_estimate_min: null,
        price_estimate_max: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      });

      const list = await shoppingDb.getShoppingListById('list-1');

      expect(list).not.toBeNull();
      expect(list!.id).toBe('list-1');
    });

    it('should return null when list not found', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      const list = await shoppingDb.getShoppingListById('nonexistent');

      expect(list).toBeNull();
    });
  });

  describe('renameShoppingList', () => {
    it('should update list name', async () => {
      await shoppingDb.renameShoppingList('list-1', 'Nouveau nom');

      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('UPDATE shopping_lists SET name');
      expect(params[0]).toBe('Nouveau nom');
      expect(params[2]).toBe('list-1');
    });

    it('should throw on database failure', async () => {
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await expect(shoppingDb.renameShoppingList('list-1', 'Name')).rejects.toThrow(
        'Impossible de renommer la liste. DB Error'
      );
    });
  });

  describe('deleteShoppingList', () => {
    it('should delete a non-default list', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'list-2',
        is_default: 0,
      });

      await shoppingDb.deleteShoppingList('list-2');

      const [sql] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('DELETE FROM shopping_lists');
    });

    it('should refuse to delete the default list', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'list-1',
        is_default: 1,
      });

      await expect(shoppingDb.deleteShoppingList('list-1')).rejects.toThrow(
        'Impossible de supprimer la liste par défaut.'
      );
    });
  });

  describe('archiveShoppingList', () => {
    it('should archive a non-default list', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'list-2',
        is_default: 0,
      });

      await shoppingDb.archiveShoppingList('list-2');

      const [sql] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('UPDATE shopping_lists SET is_active = 0');
    });

    it('should refuse to archive the default list', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'list-1',
        is_default: 1,
      });

      await expect(shoppingDb.archiveShoppingList('list-1')).rejects.toThrow(
        "Impossible d'archiver la liste par défaut."
      );
    });
  });

  describe('reactivateShoppingList', () => {
    it('should reactivate a list when under limit', async () => {
      // getActiveListCount returns 5
      mockDatabase.getFirstSync.mockReturnValue({ count: 5 });

      await shoppingDb.reactivateShoppingList('list-2');

      const runCalls = mockDatabase.runSync.mock.calls;
      const [sql] = runCalls[0];
      expect(sql).toContain('UPDATE shopping_lists SET is_active = 1');
    });

    it('should refuse reactivation when at 10 lists', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ count: 10 });

      await expect(shoppingDb.reactivateShoppingList('list-2')).rejects.toThrow(
        'Maximum 10 listes actives atteint.'
      );
    });
  });

  describe('getActiveListCount', () => {
    it('should return count of active lists', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ count: 3 });

      const count = await shoppingDb.getActiveListCount();

      expect(count).toBe(3);
      const [sql] = mockDatabase.getFirstSync.mock.calls[0];
      expect(sql).toContain('WHERE is_active = 1');
    });

    it('should return 0 when no lists exist', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      const count = await shoppingDb.getActiveListCount();

      expect(count).toBe(0);
    });
  });

  describe('getDefaultShoppingList', () => {
    it('should return the default list', async () => {
      mockDatabase.getFirstSync.mockReturnValue({
        id: 'list-1',
        name: 'Ma liste de courses',
        is_active: 1,
        is_default: 1,
        meal_count: 0,
        price_estimate_min: null,
        price_estimate_max: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      });

      const list = await shoppingDb.getDefaultShoppingList();

      expect(list).not.toBeNull();
      expect(list!.isDefault).toBe(true);
    });

    it('should return null when no default list exists', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      const list = await shoppingDb.getDefaultShoppingList();

      expect(list).toBeNull();
    });
  });

  describe('createShoppingList with isDefault', () => {
    it('should create a default list when isDefault is true', async () => {
      const list = await shoppingDb.createShoppingList('Ma liste de courses', true);

      expect(list.isDefault).toBe(true);
      const [, params] = mockDatabase.runSync.mock.calls[0];
      expect(params[2]).toBe(1); // is_default = 1
    });

    it('should create non-default list by default', async () => {
      const list = await shoppingDb.createShoppingList('Other list');

      expect(list.isDefault).toBe(false);
      const [, params] = mockDatabase.runSync.mock.calls[0];
      expect(params[2]).toBe(0); // is_default = 0
    });
  });
});
