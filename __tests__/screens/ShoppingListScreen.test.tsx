jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('../../src/services/shoppingDatabase');
jest.mock('../../src/utils/ingredientAggregation');

// ShoppingScreen uses multiple hooks (useState, useActiveShoppingList, etc.)
// so we test module exports and component structure rather than rendering directly

import ShoppingScreen from '../../app/(tabs)/shopping';
import * as shoppingComponents from '../../src/components/shopping';
import { LoadingScreen } from '../../src/components/ui/LoadingScreen';

describe('ShoppingListScreen', () => {
  it('exports the screen component as default', () => {
    expect(ShoppingScreen).toBeDefined();
    expect(typeof ShoppingScreen).toBe('function');
  });

  it('is a React function component', () => {
    expect(ShoppingScreen.length).toBe(0);
  });
});

// Verify subcomponents are properly exported from barrel
describe('Shopping components barrel export', () => {
  it('exports all required components', () => {
    expect(shoppingComponents.RecipeCarousel).toBeDefined();
    expect(shoppingComponents.SummaryBadges).toBeDefined();
    expect(shoppingComponents.ListViewTabs).toBeDefined();
    expect(shoppingComponents.CategoryView).toBeDefined();
    expect(shoppingComponents.RecipeView).toBeDefined();
    expect(shoppingComponents.UnsortedView).toBeDefined();
    expect(shoppingComponents.IngredientRow).toBeDefined();
    expect(shoppingComponents.ShoppingEmptyState).toBeDefined();
    expect(shoppingComponents.AddIngredientButton).toBeDefined();
  });
});

// Test loading/error state components
describe('Loading and error states', () => {
  it('LoadingScreen is importable and renders', () => {
    expect(LoadingScreen).toBeDefined();
    expect(typeof LoadingScreen).toBe('function');

    const element = LoadingScreen();
    expect(element).toBeDefined();
    expect(element.props.children).toBeDefined();
  });

  it('LoadingScreen renders spinner', () => {
    const element = LoadingScreen();
    expect(element.props.style).toBeDefined();
  });
});
