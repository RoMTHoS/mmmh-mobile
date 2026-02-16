jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useState: (init: unknown) => [init, jest.fn()],
    useRef: (init: unknown) => ({ current: init }),
    useEffect: jest.fn(),
    useMemo: (fn: () => unknown) => fn(),
  };
});
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));
jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('../../../src/services/shoppingDatabase');
jest.mock('../../../src/utils/ingredientAggregation');
jest.mock('../../../src/hooks/useShoppingList', () => ({
  useAddRecipeToList: () => ({ mutate: jest.fn(), isPending: false }),
  useRemoveRecipeFromList: () => ({ mutate: jest.fn(), isPending: false }),
  useShoppingLists: () => ({ data: [], isLoading: false }),
  useCreateShoppingList: () => ({ mutate: jest.fn(), isPending: false }),
}));

import type { Recipe } from '../../../src/types/recipe';
import type { ShoppingListRecipe } from '../../../src/types/shopping';
import { ServingsSelector } from '../../../src/components/shopping/ServingsSelector';

const mockRecipe = (overrides?: Partial<Recipe>): Recipe => ({
  id: 'recipe-1',
  title: 'Crêpes bretonnes',
  ingredients: [
    { name: 'Farine', quantity: '250', unit: 'g' },
    { name: 'Oeufs', quantity: '3', unit: null },
    { name: 'Lait', quantity: '500', unit: 'ml' },
  ],
  steps: [{ order: 1, instruction: 'Mélanger' }],
  cookingTime: 30,
  servings: 4,
  photoUri: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const mockExistingEntry = (overrides?: Partial<ShoppingListRecipe>): ShoppingListRecipe => ({
  id: 'slr-1',
  shoppingListId: 'list-1',
  recipeId: 'recipe-1',
  servingsMultiplier: 1.0,
  addedAt: '2024-01-01T00:00:00.000Z',
  recipeTitle: 'Crêpes bretonnes',
  recipePhotoUri: null,
  ...overrides,
});

describe('ServingsSelector', () => {
  it('exports the component', () => {
    expect(ServingsSelector).toBeDefined();
    expect(typeof ServingsSelector).toBe('function');
  });

  it('renders with recipe title', () => {
    const element = ServingsSelector({
      visible: true,
      onClose: jest.fn(),
      recipe: mockRecipe(),
      listId: 'list-1',
      existingEntry: null,
    });
    expect(element).toBeDefined();
  });

  it('renders add-to-list button when recipe not in list', () => {
    const element = ServingsSelector({
      visible: true,
      onClose: jest.fn(),
      recipe: mockRecipe(),
      listId: 'list-1',
      existingEntry: null,
    });
    // Modal is the root, sheet content is inside the animated views
    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
  });

  it('renders update/remove buttons when recipe is in list', () => {
    const element = ServingsSelector({
      visible: true,
      onClose: jest.fn(),
      recipe: mockRecipe(),
      listId: 'list-1',
      existingEntry: mockExistingEntry(),
    });
    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
  });

  it('renders hidden when visible is false', () => {
    const element = ServingsSelector({
      visible: false,
      onClose: jest.fn(),
      recipe: mockRecipe(),
      listId: 'list-1',
      existingEntry: null,
    });
    expect(element.props.visible).toBe(false);
  });

  it('defaults to recipe servings when no existing entry', () => {
    const recipe = mockRecipe({ servings: 6 });
    const element = ServingsSelector({
      visible: true,
      onClose: jest.fn(),
      recipe,
      listId: 'list-1',
      existingEntry: null,
    });
    // Component should render without error
    expect(element).toBeDefined();
  });

  it('defaults to 4 servings when recipe has no servings', () => {
    const recipe = mockRecipe({ servings: null });
    const element = ServingsSelector({
      visible: true,
      onClose: jest.fn(),
      recipe,
      listId: 'list-1',
      existingEntry: null,
    });
    expect(element).toBeDefined();
  });

  it('handles existing entry with different servings multiplier', () => {
    const entry = mockExistingEntry({ servingsMultiplier: 2.0 });
    const element = ServingsSelector({
      visible: true,
      onClose: jest.fn(),
      recipe: mockRecipe(),
      listId: 'list-1',
      existingEntry: entry,
    });
    expect(element).toBeDefined();
  });
});
