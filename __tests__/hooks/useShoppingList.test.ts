import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useActiveShoppingList,
  useShoppingListRecipes,
  useShoppingListItems,
  useAddRecipeToList,
  useRemoveRecipeFromList,
  useToggleItem,
  useAddManualItem,
  useClearCheckedItems,
} from '../../src/hooks/useShoppingList';
import * as shoppingDb from '../../src/services/shoppingDatabase';
import * as aggregation from '../../src/utils/ingredientAggregation';
import type { ShoppingList, ShoppingListRecipe, ShoppingListItem } from '../../src/types';

jest.mock('expo-sqlite');
jest.mock('react-native-uuid');
jest.mock('../../src/services/shoppingDatabase');
jest.mock('../../src/utils/ingredientAggregation');

const mockShoppingDb = shoppingDb as jest.Mocked<typeof shoppingDb>;
const mockAggregation = aggregation as jest.Mocked<typeof aggregation>;

const mockList: ShoppingList = {
  id: 'list-1',
  name: 'Ma liste de courses',
  isActive: true,
  mealCount: 2,
  priceEstimateMin: null,
  priceEstimateMax: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockRecipeEntry: ShoppingListRecipe = {
  id: 'slr-1',
  shoppingListId: 'list-1',
  recipeId: 'recipe-1',
  servingsMultiplier: 1.0,
  addedAt: '2024-01-01T00:00:00.000Z',
  recipeTitle: 'Pasta',
};

const mockItem: ShoppingListItem = {
  id: 'item-1',
  shoppingListId: 'list-1',
  name: 'Flour',
  quantity: 200,
  unit: 'g',
  category: 'pantry',
  sourceType: 'recipe',
  sourceRecipeIds: ['recipe-1'],
  isChecked: false,
  isExcluded: false,
  checkedAt: null,
  estimatedPrice: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('Shopping List Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useActiveShoppingList', () => {
    it('should return existing active list', async () => {
      mockShoppingDb.getActiveShoppingList.mockResolvedValue(mockList);

      const { result } = renderHook(() => useActiveShoppingList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockList);
    });

    it('should auto-create list when none exists', async () => {
      mockShoppingDb.getActiveShoppingList.mockResolvedValue(null);
      mockShoppingDb.createShoppingList.mockResolvedValue(mockList);

      const { result } = renderHook(() => useActiveShoppingList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockShoppingDb.createShoppingList).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockList);
    });

    it('should handle error', async () => {
      mockShoppingDb.getActiveShoppingList.mockRejectedValue(new Error('DB error'));

      const { result } = renderHook(() => useActiveShoppingList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useShoppingListRecipes', () => {
    it('should fetch recipes for list', async () => {
      mockShoppingDb.getShoppingListRecipes.mockResolvedValue([mockRecipeEntry]);

      const { result } = renderHook(() => useShoppingListRecipes('list-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockRecipeEntry]);
    });

    it('should not fetch when listId is empty', () => {
      const { result } = renderHook(() => useShoppingListRecipes(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useShoppingListItems', () => {
    it('should fetch items for list', async () => {
      mockShoppingDb.getShoppingListItems.mockResolvedValue([mockItem]);

      const { result } = renderHook(() => useShoppingListItems('list-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockItem]);
    });
  });

  describe('useAddRecipeToList', () => {
    it('should add recipe and regenerate items', async () => {
      mockShoppingDb.addRecipeToList.mockResolvedValue(mockRecipeEntry);
      mockAggregation.regenerateShoppingListItems.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAddRecipeToList(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ listId: 'list-1', recipeId: 'recipe-1' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockShoppingDb.addRecipeToList).toHaveBeenCalledWith('list-1', 'recipe-1', undefined);
      expect(mockAggregation.regenerateShoppingListItems).toHaveBeenCalledWith('list-1');
    });
  });

  describe('useRemoveRecipeFromList', () => {
    it('should remove recipe from list', async () => {
      mockShoppingDb.removeRecipeFromList.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRemoveRecipeFromList(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ listId: 'list-1', recipeId: 'recipe-1' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockShoppingDb.removeRecipeFromList).toHaveBeenCalledWith('list-1', 'recipe-1');
    });
  });

  describe('useToggleItem', () => {
    it('should toggle item checked state', async () => {
      mockShoppingDb.toggleItemChecked.mockResolvedValue(undefined);

      const { result } = renderHook(() => useToggleItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('item-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockShoppingDb.toggleItemChecked).toHaveBeenCalledWith('item-1');
    });
  });

  describe('useAddManualItem', () => {
    it('should add manual item', async () => {
      mockShoppingDb.addManualItem.mockResolvedValue(mockItem);

      const { result } = renderHook(() => useAddManualItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ listId: 'list-1', name: 'Pain' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockShoppingDb.addManualItem).toHaveBeenCalledWith(
        'list-1',
        'Pain',
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('useClearCheckedItems', () => {
    it('should clear checked items', async () => {
      mockShoppingDb.clearCheckedItems.mockResolvedValue(undefined);

      const { result } = renderHook(() => useClearCheckedItems(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('list-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockShoppingDb.clearCheckedItems).toHaveBeenCalledWith('list-1');
    });
  });
});
