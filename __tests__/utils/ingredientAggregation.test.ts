import {
  normalizeIngredientName,
  categorizeIngredient,
  aggregateIngredients,
} from '../../src/utils/ingredientAggregation';
import type { RecipeWithServings } from '../../src/types';

describe('Ingredient Aggregation', () => {
  describe('normalizeIngredientName', () => {
    it('should lowercase and trim', () => {
      expect(normalizeIngredientName('  Tomates  ')).toBe('tomate');
    });

    it('should handle French plural -s', () => {
      expect(normalizeIngredientName('Tomates')).toBe('tomate');
      expect(normalizeIngredientName('carottes')).toBe('carotte');
    });

    it('should not remove -ss endings', () => {
      expect(normalizeIngredientName('beurre')).toBe('beurre');
    });

    it('should handle -aux plurals', () => {
      expect(normalizeIngredientName('journaux')).toBe('journal');
    });

    it('should handle English -ies plurals', () => {
      expect(normalizeIngredientName('berries')).toBe('berry');
    });

    it('should handle English -es plurals', () => {
      expect(normalizeIngredientName('tomatoes')).toBe('tomato');
    });

    it('should handle short words without stripping', () => {
      expect(normalizeIngredientName('riz')).toBe('riz');
      expect(normalizeIngredientName('sel')).toBe('sel');
    });
  });

  describe('categorizeIngredient', () => {
    it('should categorize French meat ingredients', () => {
      expect(categorizeIngredient('poulet')).toBe('meat');
      expect(categorizeIngredient('Boeuf haché')).toBe('meat');
      expect(categorizeIngredient('lardon fumé')).toBe('meat');
    });

    it('should categorize French dairy ingredients', () => {
      expect(categorizeIngredient('lait')).toBe('dairy');
      expect(categorizeIngredient('beurre doux')).toBe('dairy');
      expect(categorizeIngredient('crème fraîche')).toBe('dairy');
    });

    it('should categorize French produce', () => {
      expect(categorizeIngredient('tomates cerises')).toBe('produce');
      expect(categorizeIngredient('oignon rouge')).toBe('produce');
      expect(categorizeIngredient('ail')).toBe('produce');
    });

    it('should categorize French seafood', () => {
      expect(categorizeIngredient('saumon frais')).toBe('seafood');
      expect(categorizeIngredient('crevettes')).toBe('seafood');
    });

    it('should categorize French pantry items', () => {
      expect(categorizeIngredient('farine')).toBe('pantry');
      expect(categorizeIngredient("huile d'olive")).toBe('pantry');
      expect(categorizeIngredient('sel')).toBe('pantry');
    });

    it('should categorize English ingredients', () => {
      expect(categorizeIngredient('chicken breast')).toBe('meat');
      expect(categorizeIngredient('milk')).toBe('dairy');
      expect(categorizeIngredient('garlic')).toBe('produce');
      expect(categorizeIngredient('flour')).toBe('pantry');
    });

    it('should default to other for unknown ingredients', () => {
      expect(categorizeIngredient('something unknown')).toBe('other');
      expect(categorizeIngredient('xyz123')).toBe('other');
    });
  });

  describe('aggregateIngredients', () => {
    it('should combine same ingredients from different recipes', () => {
      const recipes: RecipeWithServings[] = [
        {
          recipeId: 'recipe-1',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [{ name: 'Flour', quantity: '200', unit: 'g' }],
        },
        {
          recipeId: 'recipe-2',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [{ name: 'flour', quantity: '300', unit: 'g' }],
        },
      ];

      const result = aggregateIngredients(recipes);

      // Should combine into one item with 500g
      const flour = result.find((r) => normalizeIngredientName(r.name) === 'flour');
      expect(flour).toBeDefined();
      expect(flour!.quantity).toBe(500);
      expect(flour!.unit).toBe('g');
      expect(flour!.sourceRecipeIds).toEqual(['recipe-1', 'recipe-2']);
    });

    it('should keep items with different units separate', () => {
      const recipes: RecipeWithServings[] = [
        {
          recipeId: 'recipe-1',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [{ name: 'Sugar', quantity: '200', unit: 'g' }],
        },
        {
          recipeId: 'recipe-2',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [{ name: 'sugar', quantity: '2', unit: 'tbsp' }],
        },
      ];

      const result = aggregateIngredients(recipes);

      const sugars = result.filter((r) => normalizeIngredientName(r.name) === 'sugar');
      expect(sugars).toHaveLength(2);
    });

    it('should scale quantities by servings multiplier', () => {
      const recipes: RecipeWithServings[] = [
        {
          recipeId: 'recipe-1',
          servingsMultiplier: 2,
          originalServings: 4,
          ingredients: [{ name: 'Butter', quantity: '100', unit: 'g' }],
        },
      ];

      const result = aggregateIngredients(recipes);

      expect(result[0].quantity).toBe(200);
    });

    it('should handle missing quantities (no quantity on both → list once)', () => {
      const recipes: RecipeWithServings[] = [
        {
          recipeId: 'recipe-1',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [{ name: 'Salt', quantity: null, unit: null }],
        },
        {
          recipeId: 'recipe-2',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [{ name: 'salt', quantity: null, unit: null }],
        },
      ];

      const result = aggregateIngredients(recipes);

      const salt = result.find((r) => normalizeIngredientName(r.name) === 'salt');
      expect(salt).toBeDefined();
      expect(salt!.quantity).toBeNull();
      expect(salt!.sourceRecipeIds).toEqual(['recipe-1', 'recipe-2']);
    });

    it('should handle one item with quantity and another without (same unit key)', () => {
      const recipes: RecipeWithServings[] = [
        {
          recipeId: 'recipe-1',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [{ name: 'Olive oil', quantity: null, unit: null }],
        },
        {
          recipeId: 'recipe-2',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [{ name: 'olive oil', quantity: '2', unit: null }],
        },
      ];

      const result = aggregateIngredients(recipes);

      // Should have quantity from the one that has it
      const oil = result.find(
        (r) => normalizeIngredientName(r.name) === normalizeIngredientName('olive oil')
      );
      expect(oil).toBeDefined();
      expect(oil!.quantity).toBe(2);
    });

    it('should sort results by category then name', () => {
      const recipes: RecipeWithServings[] = [
        {
          recipeId: 'recipe-1',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [
            { name: 'sugar', quantity: '100', unit: 'g' },
            { name: 'milk', quantity: '200', unit: 'ml' },
            { name: 'garlic', quantity: '2', unit: 'cloves' },
          ],
        },
      ];

      const result = aggregateIngredients(recipes);

      // dairy < pantry < produce in alphabetical order
      expect(result[0].category).toBe('dairy');
      expect(result[1].category).toBe('pantry');
      expect(result[2].category).toBe('produce');
    });

    it('should return empty array for empty recipes', () => {
      const result = aggregateIngredients([]);
      expect(result).toEqual([]);
    });

    it('should handle recipe with no ingredients', () => {
      const recipes: RecipeWithServings[] = [
        {
          recipeId: 'recipe-1',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [],
        },
      ];

      const result = aggregateIngredients(recipes);
      expect(result).toEqual([]);
    });

    it('should not duplicate recipe ID in sourceRecipeIds', () => {
      const recipes: RecipeWithServings[] = [
        {
          recipeId: 'recipe-1',
          servingsMultiplier: 1,
          originalServings: 4,
          ingredients: [
            { name: 'Salt', quantity: '1', unit: 'tsp' },
            { name: 'salt', quantity: '2', unit: 'tsp' },
          ],
        },
      ];

      const result = aggregateIngredients(recipes);

      expect(result[0].sourceRecipeIds).toEqual(['recipe-1']);
      expect(result[0].quantity).toBe(3);
    });
  });
});
