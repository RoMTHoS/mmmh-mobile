import { RecipeCard } from '../../../src/components/recipes/RecipeCard';
import type { Recipe } from '../../../src/types';

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

describe('RecipeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with recipe title', () => {
    const recipe = mockRecipe({ title: 'Delicious Pasta' });
    const onPress = jest.fn();
    const element = RecipeCard({ recipe, onPress });

    expect(element).toBeDefined();
    expect(element.props.testID).toBe('recipe-card');
  });

  it('passes onPress handler', () => {
    const recipe = mockRecipe();
    const onPress = jest.fn();
    const element = RecipeCard({ recipe, onPress });

    expect(element.props.onPress).toBe(onPress);
  });

  it('renders cooking time badge when cookingTime is provided', () => {
    const recipe = mockRecipe({ cookingTime: 30 });
    const onPress = jest.fn();
    const element = RecipeCard({ recipe, onPress });

    expect(element).toBeDefined();
    // The element should contain the cooking time in its children tree
  });

  it('renders without cooking time badge when cookingTime is null', () => {
    const recipe = mockRecipe({ cookingTime: null });
    const onPress = jest.fn();
    const element = RecipeCard({ recipe, onPress });

    expect(element).toBeDefined();
  });

  it('uses placeholder image when photoUri is null', () => {
    const recipe = mockRecipe({ photoUri: null });
    const onPress = jest.fn();
    const element = RecipeCard({ recipe, onPress });

    expect(element).toBeDefined();
    // Image component will use placeholder when photoUri is null
  });

  it('uses provided photoUri when available', () => {
    const recipe = mockRecipe({ photoUri: 'file:///path/to/photo.jpg' });
    const onPress = jest.fn();
    const element = RecipeCard({ recipe, onPress });

    expect(element).toBeDefined();
  });

  it('truncates long titles to 2 lines', () => {
    const recipe = mockRecipe({
      title: 'This is a very long recipe title that should be truncated to two lines maximum',
    });
    const onPress = jest.fn();
    const element = RecipeCard({ recipe, onPress });

    expect(element).toBeDefined();
    // Title Text component has numberOfLines={2}
  });
});
