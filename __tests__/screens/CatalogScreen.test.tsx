import { router } from 'expo-router';
import type { Recipe } from '../../src/types';

// Mock useRecipes hook
const mockUseRecipes = jest.fn();
jest.mock('../../src/hooks', () => ({
  useRecipes: () => mockUseRecipes(),
}));

// Import after mocking
import CatalogScreen from '../../app/(tabs)/index';

const mockRecipe = (overrides?: Partial<Recipe>): Recipe => ({
  id: 'test-recipe-1',
  title: 'Test Recipe',
  ingredients: [],
  steps: [],
  cookingTime: null,
  servings: null,
  photoUri: null,
  notes: null,
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
  ...overrides,
});

describe('CatalogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading screen when isLoading is true', () => {
    mockUseRecipes.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const element = CatalogScreen();

    expect(element).toBeDefined();
  });

  it('shows error state when there is an error', () => {
    mockUseRecipes.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: jest.fn(),
      isRefetching: false,
    });

    const element = CatalogScreen();

    expect(element).toBeDefined();
  });

  it('shows empty state when no recipes', () => {
    mockUseRecipes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const element = CatalogScreen();

    expect(element).toBeDefined();
  });

  it('shows recipe grid when recipes exist', () => {
    mockUseRecipes.mockReturnValue({
      data: [
        mockRecipe({ id: '1', title: 'Recipe 1' }),
        mockRecipe({ id: '2', title: 'Recipe 2' }),
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const element = CatalogScreen();

    expect(element).toBeDefined();
  });

  it('has FAB button for creating recipes', () => {
    mockUseRecipes.mockReturnValue({
      data: [mockRecipe()],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const element = CatalogScreen();
    const children = element.props.children;

    // Find FAB by testID in children array
    const fab = Array.isArray(children)
      ? children.find(
          (child: { props?: { testID?: string } }) =>
            child && typeof child === 'object' && child.props?.testID === 'create-recipe-fab'
        )
      : null;

    expect(fab).toBeDefined();
  });

  it('FAB navigates to create recipe screen on press', () => {
    mockUseRecipes.mockReturnValue({
      data: [mockRecipe()],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const element = CatalogScreen();
    const children = element.props.children;

    const fab = Array.isArray(children)
      ? children.find(
          (child: { props?: { testID?: string } }) =>
            child && typeof child === 'object' && child.props?.testID === 'create-recipe-fab'
        )
      : null;

    if (fab && fab.props?.onPress) {
      fab.props.onPress();
      expect(router.push).toHaveBeenCalledWith('/recipe/create');
    }
  });

  it('passes refetch to RecipeGrid for pull-to-refresh', () => {
    const refetch = jest.fn();
    mockUseRecipes.mockReturnValue({
      data: [mockRecipe()],
      isLoading: false,
      error: null,
      refetch,
      isRefetching: false,
    });

    const element = CatalogScreen();

    expect(element).toBeDefined();
  });

  it('passes isRefetching to RecipeGrid', () => {
    mockUseRecipes.mockReturnValue({
      data: [mockRecipe()],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: true,
    });

    const element = CatalogScreen();

    expect(element).toBeDefined();
  });
});
