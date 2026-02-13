jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useState: (init: unknown) => [init, jest.fn()],
    useRef: (init: unknown) => ({ current: init }),
    useEffect: jest.fn(),
  };
});

import type { ShoppingListRecipe } from '../../../src/types';
import { RecipeCarousel } from '../../../src/components/shopping/RecipeCarousel';

const mockRecipe = (overrides?: Partial<ShoppingListRecipe>): ShoppingListRecipe => ({
  id: 'slr-1',
  shoppingListId: 'list-1',
  recipeId: 'r1',
  servingsMultiplier: 1.0,
  addedAt: '2024-01-01T00:00:00.000Z',
  recipeTitle: 'Crêpes',
  recipePhotoUri: null,
  ...overrides,
});

describe('RecipeCarousel', () => {
  it('exports the component', () => {
    expect(RecipeCarousel).toBeDefined();
    expect(typeof RecipeCarousel).toBe('function');
  });

  it('has recipe-carousel testID', () => {
    const element = RecipeCarousel({ recipes: [] });
    expect(element.props.testID).toBe('recipe-carousel');
  });

  it('renders section title', () => {
    const element = RecipeCarousel({ recipes: [] });
    const children = element.props.children;
    // First child is the section title Text
    expect(children[0].props.children).toBe('Recettes dans la liste');
  });

  it('passes recipes data to FlatList', () => {
    const recipes = [
      mockRecipe({ recipeId: 'r1', recipeTitle: 'Crêpes' }),
      mockRecipe({ id: 'slr-2', recipeId: 'r2', recipeTitle: 'Pasta' }),
    ];

    const element = RecipeCarousel({ recipes });
    const flatList = element.props.children[1];
    expect(flatList.props.data).toHaveLength(2);
    expect(flatList.props.horizontal).toBe(true);
    expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
  });

  it('handles empty recipes array', () => {
    const element = RecipeCarousel({ recipes: [] });
    const flatList = element.props.children[1];
    expect(flatList.props.data).toEqual([]);
  });

  it('accepts highlightRecipeId prop', () => {
    const recipes = [mockRecipe({ recipeId: 'r1' })];
    const element = RecipeCarousel({ recipes, highlightRecipeId: 'r1' });
    expect(element).toBeDefined();
    expect(element.props.testID).toBe('recipe-carousel');
  });

  it('renders without highlightRecipeId', () => {
    const recipes = [mockRecipe({ recipeId: 'r1' })];
    const element = RecipeCarousel({ recipes });
    expect(element).toBeDefined();
  });

  it('handles highlightRecipeId not in recipes list', () => {
    const recipes = [mockRecipe({ recipeId: 'r1' })];
    const element = RecipeCarousel({ recipes, highlightRecipeId: 'non-existent' });
    expect(element).toBeDefined();
  });
});
