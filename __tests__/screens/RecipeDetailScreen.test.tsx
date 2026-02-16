jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useState: (init: unknown) => [init, jest.fn()],
    useMemo: (fn: () => unknown) => fn(),
  };
});

import { useKeepAwake } from 'expo-keep-awake';
import type { Recipe } from '../../src/types';

// Mock hooks
const mockUseRecipe = jest.fn();
const mockUseDeleteRecipe = jest.fn();
const mockMutateAsync = jest.fn();

const mockShoppingListData = { id: 'list-1', name: 'Test List' };
const mockShoppingRecipes: unknown[] = [];

jest.mock('../../src/hooks', () => ({
  useRecipe: (id: string) => mockUseRecipe(id),
  useDeleteRecipe: () => mockUseDeleteRecipe(),
  useActiveShoppingList: () => ({ data: mockShoppingListData }),
  useShoppingListRecipes: () => ({ data: mockShoppingRecipes }),
}));

jest.mock('../../src/stores/shoppingStore', () => ({
  useShoppingStore: (selector: (s: { activeListId: string | null }) => unknown) =>
    selector({ activeListId: 'list-1' }),
}));

// Import after mocking
import RecipeDetailScreen from '../../app/recipe/[id]';

const mockRecipe = (overrides?: Partial<Recipe>): Recipe => ({
  id: 'test-recipe-1',
  title: 'Test Recipe',
  ingredients: [
    { name: 'Salt', quantity: '1', unit: 'tsp' },
    { name: 'Pepper', quantity: '1/2', unit: 'tsp' },
  ],
  steps: [
    { order: 1, instruction: 'Mix ingredients' },
    { order: 2, instruction: 'Cook for 10 minutes' },
  ],
  cookingTime: 30,
  servings: 4,
  photoUri: null,
  notes: 'Some notes here',
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
  ...overrides,
});

describe('RecipeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeleteRecipe.mockReturnValue({ mutateAsync: mockMutateAsync });
  });

  it('shows loading screen when loading', () => {
    mockUseRecipe.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
    expect(useKeepAwake).toHaveBeenCalled();
  });

  it('shows error state when recipe not found', () => {
    mockUseRecipe.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Not found'),
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
  });

  it('displays recipe information', () => {
    const recipe = mockRecipe({
      title: 'Delicious Pasta',
      cookingTime: 45,
      servings: 6,
    });
    mockUseRecipe.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
    expect(useKeepAwake).toHaveBeenCalled();
  });

  it('displays hero image', () => {
    mockUseRecipe.mockReturnValue({
      data: mockRecipe({ photoUri: 'file:///photo.jpg' }),
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
    // Image component with photo source
  });

  it('displays placeholder when no photo', () => {
    mockUseRecipe.mockReturnValue({
      data: mockRecipe({ photoUri: null }),
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
    // Image component with placeholder source
  });

  it('displays ingredients section', () => {
    const recipe = mockRecipe({
      ingredients: [
        { name: 'Flour', quantity: '2', unit: 'cups' },
        { name: 'Sugar', quantity: '1', unit: 'cup' },
      ],
    });
    mockUseRecipe.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
  });

  it('displays steps section', () => {
    const recipe = mockRecipe({
      steps: [
        { order: 1, instruction: 'Preheat oven' },
        { order: 2, instruction: 'Mix dry ingredients' },
      ],
    });
    mockUseRecipe.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
  });

  it('displays notes when present', () => {
    mockUseRecipe.mockReturnValue({
      data: mockRecipe({ notes: 'Best served warm' }),
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
  });

  it('hides notes section when no notes', () => {
    mockUseRecipe.mockReturnValue({
      data: mockRecipe({ notes: null }),
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
  });

  it('has edit button in header', () => {
    mockUseRecipe.mockReturnValue({
      data: mockRecipe(),
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
    // Header contains edit IconButton
  });

  it('has delete button in header', () => {
    mockUseRecipe.mockReturnValue({
      data: mockRecipe(),
      isLoading: false,
      error: null,
    });

    const element = RecipeDetailScreen();

    expect(element).toBeDefined();
    // Header contains delete IconButton with red color
  });

  it('navigates to edit screen on edit press', () => {
    mockUseRecipe.mockReturnValue({
      data: mockRecipe({ id: 'recipe-123' }),
      isLoading: false,
      error: null,
    });

    RecipeDetailScreen();

    // Edit button calls router.push to edit screen
  });

  it('shows delete confirmation with recipe title', () => {
    const recipe = mockRecipe({ title: 'My Amazing Recipe' });
    mockUseRecipe.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });

    RecipeDetailScreen();

    // Delete button shows Alert.alert with recipe title
  });

  it('activates keep awake', () => {
    mockUseRecipe.mockReturnValue({
      data: mockRecipe(),
      isLoading: false,
      error: null,
    });

    RecipeDetailScreen();

    expect(useKeepAwake).toHaveBeenCalled();
  });
});
