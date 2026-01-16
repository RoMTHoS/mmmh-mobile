import type { CreateRecipeInput } from '../../src/types';

// Mock modules before imports
jest.mock('expo-sqlite');
jest.mock('react-native-uuid');

// Import after mocking
import * as db from '../../src/services/database';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SQLiteMock = require('../../__mocks__/expo-sqlite');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const uuidMock = require('../../__mocks__/react-native-uuid');

const mockDatabase = SQLiteMock.__mockDatabase;

const RECIPE_COUNT = 150;
const PERFORMANCE_THRESHOLD_MS = 100;

function generateMockRecipe(index: number): CreateRecipeInput {
  return {
    title: `Test Recipe ${index + 1}`,
    ingredients: [
      { name: 'Ingredient 1', quantity: '1', unit: 'cup' },
      { name: 'Ingredient 2', quantity: '2', unit: 'tbsp' },
      { name: 'Ingredient 3', quantity: '3', unit: 'tsp' },
    ],
    steps: [
      { order: 1, instruction: 'Step one instructions here with some detail' },
      { order: 2, instruction: 'Step two instructions here with more detail' },
      { order: 3, instruction: 'Step three instructions here with final detail' },
    ],
    cookingTime: Math.floor(Math.random() * 60) + 10,
    servings: Math.floor(Math.random() * 6) + 2,
    photoUri: null,
    notes: `Notes for recipe ${index + 1}`,
  };
}

describe('Database Performance', () => {
  beforeEach(() => {
    SQLiteMock.__resetMocks();
    uuidMock.__resetCounter();
    db.resetDatabase();
  });

  describe('getAllRecipes performance', () => {
    it(`should retrieve ${RECIPE_COUNT} recipes in under ${PERFORMANCE_THRESHOLD_MS}ms`, async () => {
      // Generate mock rows for 150 recipes
      const mockRows = Array.from({ length: RECIPE_COUNT }, (_, i) => ({
        id: `recipe-${i}`,
        title: `Test Recipe ${i + 1}`,
        ingredients: JSON.stringify([
          { name: 'Ingredient 1', quantity: '1', unit: 'cup' },
          { name: 'Ingredient 2', quantity: '2', unit: 'tbsp' },
          { name: 'Ingredient 3', quantity: '3', unit: 'tsp' },
        ]),
        steps: JSON.stringify([
          { order: 1, instruction: 'Step one instructions here with some detail' },
          { order: 2, instruction: 'Step two instructions here with more detail' },
          { order: 3, instruction: 'Step three instructions here with final detail' },
        ]),
        cookingTime: 30,
        servings: 4,
        photoUri: null,
        notes: `Notes for recipe ${i + 1}`,
        createdAt: new Date(Date.now() - i * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 1000).toISOString(),
      }));

      mockDatabase.getAllSync.mockReturnValue(mockRows);

      const start = performance.now();
      const recipes = await db.getAllRecipes();
      const duration = performance.now() - start;

      expect(recipes).toHaveLength(RECIPE_COUNT);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should handle recipes with large ingredients lists efficiently', async () => {
      const largeIngredientsList = Array.from({ length: 50 }, (_, i) => ({
        name: `Ingredient ${i + 1}`,
        quantity: `${i + 1}`,
        unit: 'units',
      }));

      const mockRows = Array.from({ length: 50 }, (_, i) => ({
        id: `recipe-${i}`,
        title: `Recipe with many ingredients ${i + 1}`,
        ingredients: JSON.stringify(largeIngredientsList),
        steps: JSON.stringify([{ order: 1, instruction: 'Mix all ingredients' }]),
        cookingTime: 60,
        servings: 8,
        photoUri: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      mockDatabase.getAllSync.mockReturnValue(mockRows);

      const start = performance.now();
      const recipes = await db.getAllRecipes();
      const duration = performance.now() - start;

      expect(recipes).toHaveLength(50);
      expect(recipes[0].ingredients).toHaveLength(50);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe('createRecipe performance', () => {
    it('should create a recipe quickly', async () => {
      const input = generateMockRecipe(0);

      const start = performance.now();
      await db.createRecipe(input);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should batch create recipes efficiently', async () => {
      const inputs = Array.from({ length: 10 }, (_, i) => generateMockRecipe(i));

      const start = performance.now();
      for (const input of inputs) {
        await db.createRecipe(input);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(mockDatabase.runSync).toHaveBeenCalledTimes(10);
    });
  });

  describe('getRecipeById performance', () => {
    it('should retrieve single recipe quickly', async () => {
      const mockRow = {
        id: 'recipe-123',
        title: 'Test Recipe',
        ingredients: JSON.stringify([{ name: 'Salt', quantity: '1', unit: 'tsp' }]),
        steps: JSON.stringify([{ order: 1, instruction: 'Add salt' }]),
        cookingTime: 30,
        servings: 4,
        photoUri: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDatabase.getFirstSync.mockReturnValue(mockRow);

      const start = performance.now();
      const recipe = await db.getRecipeById('recipe-123');
      const duration = performance.now() - start;

      expect(recipe).not.toBeNull();
      expect(duration).toBeLessThan(10);
    });
  });
});
