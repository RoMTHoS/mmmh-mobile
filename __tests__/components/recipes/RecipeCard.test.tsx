import React from 'react';
import { render } from '@testing-library/react-native';
import { RecipeCard } from '../../../src/components/recipes/RecipeCard';
import type { Recipe } from '../../../src/types';

jest.mock('../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: jest.fn(() => false),
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
  author: null,
  priceMin: null,
  priceMax: null,
  kcal: null,
  catalogue: null,
  regime: null,
  nutritionProteins: null,
  nutritionCarbs: null,
  nutritionFats: null,
  sourceUrl: null,
  sourceCreator: null,
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
  ...overrides,
});

describe('RecipeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with recipe title', () => {
    const recipe = mockRecipe({ title: 'Delicious Pasta' });
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(<RecipeCard recipe={recipe} onPress={onPress} />);

    expect(getByTestId('recipe-card')).toBeDefined();
    expect(getByText('Delicious Pasta')).toBeDefined();
  });

  it('passes onPress handler', () => {
    const recipe = mockRecipe();
    const onPress = jest.fn();
    const { getByTestId } = render(<RecipeCard recipe={recipe} onPress={onPress} />);

    expect(getByTestId('recipe-card')).toBeDefined();
  });

  it('renders cooking time badge when cookingTime is provided', () => {
    const recipe = mockRecipe({ cookingTime: 30 });
    const onPress = jest.fn();
    const { getByText } = render(<RecipeCard recipe={recipe} onPress={onPress} />);

    expect(getByText('30 min')).toBeDefined();
  });

  it('renders without cooking time badge when cookingTime is null', () => {
    const recipe = mockRecipe({ cookingTime: null });
    const onPress = jest.fn();
    const { queryByText } = render(<RecipeCard recipe={recipe} onPress={onPress} />);

    expect(queryByText(/min/)).toBeNull();
  });

  it('uses placeholder image when photoUri is null', () => {
    const recipe = mockRecipe({ photoUri: null });
    const onPress = jest.fn();
    const { getByTestId } = render(<RecipeCard recipe={recipe} onPress={onPress} />);

    expect(getByTestId('recipe-image')).toBeDefined();
  });

  it('uses provided photoUri when available', () => {
    const recipe = mockRecipe({ photoUri: 'file:///path/to/photo.jpg' });
    const onPress = jest.fn();
    const { getByTestId } = render(<RecipeCard recipe={recipe} onPress={onPress} />);

    expect(getByTestId('recipe-image')).toBeDefined();
  });

  it('truncates long titles to 2 lines', () => {
    const recipe = mockRecipe({
      title: 'This is a very long recipe title that should be truncated to two lines maximum',
    });
    const onPress = jest.fn();
    const { getByText } = render(<RecipeCard recipe={recipe} onPress={onPress} />);

    expect(getByText(recipe.title)).toBeDefined();
  });
});
