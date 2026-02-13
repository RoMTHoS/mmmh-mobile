import type { ShoppingListItem, ShoppingListRecipe } from '../../../src/types';
import { RecipeView } from '../../../src/components/shopping/RecipeView';

const mockItem = (overrides?: Partial<ShoppingListItem>): ShoppingListItem => ({
  id: 'item-1',
  shoppingListId: 'list-1',
  name: 'Farine',
  quantity: 200,
  unit: 'g',
  category: 'pantry',
  sourceType: 'recipe',
  sourceRecipeIds: ['r1'],
  isChecked: false,
  isExcluded: false,
  checkedAt: null,
  estimatedPrice: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const mockRecipe = (overrides?: Partial<ShoppingListRecipe>): ShoppingListRecipe => ({
  id: 'slr-1',
  shoppingListId: 'list-1',
  recipeId: 'r1',
  servingsMultiplier: 1.0,
  addedAt: '2024-01-01T00:00:00.000Z',
  recipeTitle: 'Crêpes',
  ...overrides,
});

describe('RecipeView', () => {
  const mockToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the component', () => {
    expect(RecipeView).toBeDefined();
    expect(typeof RecipeView).toBe('function');
  });

  it('groups items by source recipe', () => {
    const recipes = [
      mockRecipe({ recipeId: 'r1', recipeTitle: 'Crêpes' }),
      mockRecipe({ id: 'slr-2', recipeId: 'r2', recipeTitle: 'Pasta' }),
    ];
    const items = [
      mockItem({ id: 'i1', sourceRecipeIds: ['r1'], name: 'Farine' }),
      mockItem({ id: 'i2', sourceRecipeIds: ['r1'], name: 'Lait' }),
      mockItem({ id: 'i3', sourceRecipeIds: ['r2'], name: 'Spaghetti' }),
    ];

    const element = RecipeView({ items, recipes, onToggleItem: mockToggle });
    expect(element.props.sections).toHaveLength(2);
    expect(element.props.sections[0].title).toBe('Crêpes');
    expect(element.props.sections[0].data).toHaveLength(2);
    expect(element.props.sections[1].title).toBe('Pasta');
    expect(element.props.sections[1].data).toHaveLength(1);
  });

  it('shows manual items in separate section at bottom', () => {
    const recipes = [mockRecipe({ recipeId: 'r1', recipeTitle: 'Crêpes' })];
    const items = [
      mockItem({ id: 'i1', sourceType: 'recipe', sourceRecipeIds: ['r1'], name: 'Farine' }),
      mockItem({ id: 'i2', sourceType: 'manual', sourceRecipeIds: null, name: 'Pain' }),
    ];

    const element = RecipeView({ items, recipes, onToggleItem: mockToggle });
    expect(element.props.sections).toHaveLength(2);
    expect(element.props.sections[1].title).toBe('Ajouts manuels');
    expect(element.props.sections[1].data).toHaveLength(1);
  });

  it('handles empty items', () => {
    const element = RecipeView({ items: [], recipes: [], onToggleItem: mockToggle });
    expect(element.props.sections).toEqual([]);
  });

  it('has recipe-view testID', () => {
    const element = RecipeView({ items: [], recipes: [], onToggleItem: mockToggle });
    expect(element.props.testID).toBe('recipe-view');
  });
});
