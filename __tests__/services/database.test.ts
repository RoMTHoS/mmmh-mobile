import type { CreateRecipeInput, UpdateRecipeInput } from '../../src/types';

// Mock modules before imports
jest.mock('expo-sqlite');
jest.mock('react-native-uuid');

// Import after mocking
import * as db from '../../src/services/database';

// Use require for mocks to access helper functions
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SQLiteMock = require('../../__mocks__/expo-sqlite');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const uuidMock = require('../../__mocks__/react-native-uuid');

const mockDatabase = SQLiteMock.__mockDatabase;

describe('Database Service', () => {
  beforeEach(() => {
    SQLiteMock.__resetMocks();
    uuidMock.__resetCounter();
    db.resetDatabase();
  });

  describe('initializeDatabase', () => {
    it('should run migrations when schema_version table does not exist', async () => {
      mockDatabase.getFirstSync.mockImplementation(() => {
        throw new Error('no such table: schema_version');
      });

      await db.initializeDatabase();

      expect(mockDatabase.execSync).toHaveBeenCalledTimes(2);
      expect(mockDatabase.execSync.mock.calls[0][0]).toContain(
        'CREATE TABLE IF NOT EXISTS recipes'
      );
      expect(mockDatabase.execSync.mock.calls[0][0]).toContain(
        'CREATE TABLE IF NOT EXISTS schema_version'
      );
      expect(mockDatabase.execSync.mock.calls[1][0]).toContain(
        'CREATE TABLE IF NOT EXISTS shopping_lists'
      );
    });

    it('should skip migrations when database is current version', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ version: 2 });

      await db.initializeDatabase();

      expect(mockDatabase.execSync).not.toHaveBeenCalled();
    });
  });

  describe('createRecipe', () => {
    const validInput: CreateRecipeInput = {
      title: 'Test Recipe',
      ingredients: [{ name: 'Salt', quantity: '1', unit: 'tsp' }],
      steps: [{ order: 1, instruction: 'Add salt' }],
      cookingTime: 30,
      servings: 4,
      photoUri: null,
      notes: null,
    };

    it('should create a recipe with generated id and timestamps', async () => {
      const recipe = await db.createRecipe(validInput);

      expect(recipe.id).toBe('test-uuid-1');
      expect(recipe.title).toBe('Test Recipe');
      expect(recipe.ingredients).toEqual(validInput.ingredients);
      expect(recipe.steps).toEqual(validInput.steps);
      expect(recipe.cookingTime).toBe(30);
      expect(recipe.servings).toBe(4);
      expect(recipe.createdAt).toBeDefined();
      expect(recipe.updatedAt).toBeDefined();
      expect(recipe.createdAt).toBe(recipe.updatedAt);
    });

    it('should call database with correct parameters', async () => {
      await db.createRecipe(validInput);

      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('INSERT INTO recipes');
      expect(params[0]).toBe('test-uuid-1');
      expect(params[1]).toBe('Test Recipe');
      expect(params[2]).toBe(JSON.stringify(validInput.ingredients));
      expect(params[3]).toBe(JSON.stringify(validInput.steps));
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('SQLITE_CONSTRAINT');
      });

      await expect(db.createRecipe(validInput)).rejects.toThrow(
        'Failed to save recipe. SQLITE_CONSTRAINT'
      );
    });

    it('should handle recipe with null optional fields', async () => {
      const minimalInput: CreateRecipeInput = {
        title: 'Minimal Recipe',
        ingredients: [],
        steps: [],
        cookingTime: null,
        servings: null,
        photoUri: null,
        notes: null,
      };

      const recipe = await db.createRecipe(minimalInput);

      expect(recipe.cookingTime).toBeNull();
      expect(recipe.servings).toBeNull();
      expect(recipe.photoUri).toBeNull();
      expect(recipe.notes).toBeNull();
    });
  });

  describe('getRecipeById', () => {
    it('should return recipe when found', async () => {
      const mockRow = {
        id: 'recipe-123',
        title: 'Found Recipe',
        ingredients: '[{"name":"Sugar","quantity":"2","unit":"cups"}]',
        steps: '[{"order":1,"instruction":"Mix well"}]',
        cookingTime: 45,
        servings: 6,
        photoUri: null,
        notes: 'Test notes',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockDatabase.getFirstSync.mockReturnValue(mockRow);

      const recipe = await db.getRecipeById('recipe-123');

      expect(recipe).not.toBeNull();
      expect(recipe!.id).toBe('recipe-123');
      expect(recipe!.title).toBe('Found Recipe');
      expect(recipe!.ingredients).toEqual([{ name: 'Sugar', quantity: '2', unit: 'cups' }]);
      expect(recipe!.steps).toEqual([{ order: 1, instruction: 'Mix well' }]);
    });

    it('should return null when recipe not found', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      const recipe = await db.getRecipeById('non-existent');

      expect(recipe).toBeNull();
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.getFirstSync.mockImplementation(() => {
        throw new Error('Database locked');
      });

      await expect(db.getRecipeById('test-id')).rejects.toThrow(
        'Failed to load recipe. Database locked'
      );
    });
  });

  describe('getAllRecipes', () => {
    it('should return empty array when no recipes exist', async () => {
      mockDatabase.getAllSync.mockReturnValue([]);

      const recipes = await db.getAllRecipes();

      expect(recipes).toEqual([]);
    });

    it('should return all recipes sorted by createdAt', async () => {
      const mockRows = [
        {
          id: 'recipe-1',
          title: 'Recipe 1',
          ingredients: '[]',
          steps: '[]',
          cookingTime: null,
          servings: null,
          photoUri: null,
          notes: null,
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
        {
          id: 'recipe-2',
          title: 'Recipe 2',
          ingredients: '[]',
          steps: '[]',
          cookingTime: null,
          servings: null,
          photoUri: null,
          notes: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockDatabase.getAllSync.mockReturnValue(mockRows);

      const recipes = await db.getAllRecipes();

      expect(recipes).toHaveLength(2);
      expect(recipes[0].id).toBe('recipe-1');
      expect(recipes[1].id).toBe('recipe-2');
    });

    it('should deserialize JSON fields correctly', async () => {
      const mockRows = [
        {
          id: 'recipe-1',
          title: 'Complex Recipe',
          ingredients:
            '[{"name":"Flour","quantity":"2","unit":"cups"},{"name":"Eggs","quantity":"3","unit":null}]',
          steps: '[{"order":1,"instruction":"Mix"},{"order":2,"instruction":"Bake"}]',
          cookingTime: 60,
          servings: 8,
          photoUri: 'file://photo.jpg',
          notes: 'Family recipe',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockDatabase.getAllSync.mockReturnValue(mockRows);

      const recipes = await db.getAllRecipes();

      expect(recipes[0].ingredients).toHaveLength(2);
      expect(recipes[0].ingredients[0].name).toBe('Flour');
      expect(recipes[0].steps).toHaveLength(2);
      expect(recipes[0].steps[1].instruction).toBe('Bake');
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.getAllSync.mockImplementation(() => {
        throw new Error('IO Error');
      });

      await expect(db.getAllRecipes()).rejects.toThrow('Failed to load recipes. IO Error');
    });
  });

  describe('updateRecipe', () => {
    const existingRecipe = {
      id: 'recipe-123',
      title: 'Original Title',
      ingredients: '[]',
      steps: '[]',
      cookingTime: 30,
      servings: 4,
      photoUri: null,
      notes: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should update recipe with new values', async () => {
      mockDatabase.getFirstSync.mockReturnValue(existingRecipe);

      const updateInput: UpdateRecipeInput = {
        title: 'Updated Title',
        cookingTime: 45,
      };

      const updated = await db.updateRecipe('recipe-123', updateInput);

      expect(updated.title).toBe('Updated Title');
      expect(updated.cookingTime).toBe(45);
      expect(updated.servings).toBe(4); // unchanged
      expect(updated.updatedAt).not.toBe(existingRecipe.updatedAt);
    });

    it('should throw error when recipe not found', async () => {
      mockDatabase.getFirstSync.mockReturnValue(null);

      await expect(db.updateRecipe('non-existent', { title: 'New Title' })).rejects.toThrow(
        'Recipe not found'
      );
    });

    it('should call database with correct update query', async () => {
      mockDatabase.getFirstSync.mockReturnValue(existingRecipe);

      await db.updateRecipe('recipe-123', { title: 'New Title' });

      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      const [sql] = mockDatabase.runSync.mock.calls[0];
      expect(sql).toContain('UPDATE recipes SET');
      expect(sql).toContain('WHERE id = ?');
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.getFirstSync.mockReturnValue(existingRecipe);
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      await expect(db.updateRecipe('recipe-123', { title: 'New Title' })).rejects.toThrow(
        'Failed to update recipe. Write failed'
      );
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe by id', async () => {
      await db.deleteRecipe('recipe-123');

      expect(mockDatabase.runSync).toHaveBeenCalledTimes(1);
      expect(mockDatabase.runSync).toHaveBeenCalledWith('DELETE FROM recipes WHERE id = ?', [
        'recipe-123',
      ]);
    });

    it('should not throw when deleting non-existent recipe', async () => {
      await expect(db.deleteRecipe('non-existent')).resolves.toBeUndefined();
    });

    it('should throw user-friendly error on database failure', async () => {
      mockDatabase.runSync.mockImplementation(() => {
        throw new Error('Delete blocked');
      });

      await expect(db.deleteRecipe('recipe-123')).rejects.toThrow(
        'Failed to delete recipe. Delete blocked'
      );
    });
  });

  describe('getRecipeCount', () => {
    it('should return count of recipes', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ count: 42 });

      const count = await db.getRecipeCount();

      expect(count).toBe(42);
    });

    it('should return 0 when no recipes exist', async () => {
      mockDatabase.getFirstSync.mockReturnValue({ count: 0 });

      const count = await db.getRecipeCount();

      expect(count).toBe(0);
    });
  });
});
