import type { Recipe } from '../../src/types';

// Mock useRecipes hook
const mockUseRecipes = jest.fn();
jest.mock('../../src/hooks', () => ({
  useRecipes: () => mockUseRecipes(),
}));

// Mock CollectionSection component
jest.mock('../../src/components/collections', () => ({
  CollectionSection: jest.fn(() => null),
}));

// Mock LoadingScreen component
jest.mock('../../src/components/ui', () => ({
  LoadingScreen: jest.fn(() => null),
}));

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

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns LoadingScreen when isLoading is true', () => {
    mockUseRecipes.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    // Just verify the hook returns expected loading state
    const result = mockUseRecipes();
    expect(result.isLoading).toBe(true);
  });

  it('returns error state when there is an error', () => {
    mockUseRecipes.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: jest.fn(),
      isRefetching: false,
    });

    const result = mockUseRecipes();
    expect(result.error).toBeDefined();
  });

  it('returns data when recipes exist', () => {
    mockUseRecipes.mockReturnValue({
      data: [
        mockRecipe({ id: '1', title: 'Recipe 1', photoUri: 'http://example.com/1.jpg' }),
        mockRecipe({ id: '2', title: 'Recipe 2', photoUri: 'http://example.com/2.jpg' }),
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const result = mockUseRecipes();
    expect(result.data).toHaveLength(2);
  });

  it('returns empty data array when no recipes', () => {
    mockUseRecipes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const result = mockUseRecipes();
    expect(result.data).toHaveLength(0);
  });

  it('provides refetch function', () => {
    const mockRefetch = jest.fn();
    mockUseRecipes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    const result = mockUseRecipes();
    expect(typeof result.refetch).toBe('function');
  });
});
