import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as shoppingDb from '../services/shoppingDatabase';
import { regenerateShoppingListItems } from '../utils/ingredientAggregation';
import type { IngredientCategoryCode, ShoppingListItem } from '../types';

const SHOPPING_LIST_KEY = ['shopping-list'];
const SHOPPING_LIST_RECIPES_KEY = ['shopping-list-recipes'];
const SHOPPING_LIST_ITEMS_KEY = ['shopping-list-items'];

export function useActiveShoppingList() {
  return useQuery({
    queryKey: SHOPPING_LIST_KEY,
    queryFn: async () => {
      const list = await shoppingDb.getActiveShoppingList();
      if (list) return list;
      // Auto-create if none exists
      return shoppingDb.createShoppingList();
    },
  });
}

export function useShoppingListRecipes(listId: string) {
  return useQuery({
    queryKey: [...SHOPPING_LIST_RECIPES_KEY, listId],
    queryFn: () => shoppingDb.getShoppingListRecipes(listId),
    enabled: !!listId,
  });
}

export function useShoppingListItems(listId: string) {
  return useQuery({
    queryKey: [...SHOPPING_LIST_ITEMS_KEY, listId],
    queryFn: () => shoppingDb.getShoppingListItems(listId),
    enabled: !!listId,
  });
}

export function useAddRecipeToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      recipeId,
      servingsMultiplier,
    }: {
      listId: string;
      recipeId: string;
      servingsMultiplier?: number;
    }) => {
      const result = await shoppingDb.addRecipeToList(listId, recipeId, servingsMultiplier);
      await regenerateShoppingListItems(listId);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
      queryClient.invalidateQueries({
        queryKey: [...SHOPPING_LIST_RECIPES_KEY, variables.listId],
      });
      queryClient.invalidateQueries({
        queryKey: [...SHOPPING_LIST_ITEMS_KEY, variables.listId],
      });
    },
  });
}

export function useRemoveRecipeFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, recipeId }: { listId: string; recipeId: string }) => {
      await shoppingDb.removeRecipeFromList(listId, recipeId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
      queryClient.invalidateQueries({
        queryKey: [...SHOPPING_LIST_RECIPES_KEY, variables.listId],
      });
      queryClient.invalidateQueries({
        queryKey: [...SHOPPING_LIST_ITEMS_KEY, variables.listId],
      });
    },
  });
}

export function useToggleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => shoppingDb.toggleItemChecked(itemId),
    onMutate: async (itemId) => {
      // Optimistic update for instant checkbox toggle
      const queryKeys = queryClient
        .getQueriesData<ShoppingListItem[]>({ queryKey: SHOPPING_LIST_ITEMS_KEY })
        .map(([key]) => key);

      const previousData: Record<string, ShoppingListItem[] | undefined> = {};

      for (const key of queryKeys) {
        const keyStr = JSON.stringify(key);
        previousData[keyStr] = queryClient.getQueryData<ShoppingListItem[]>(key);

        queryClient.setQueryData<ShoppingListItem[]>(key, (old) =>
          old?.map((item) => (item.id === itemId ? { ...item, isChecked: !item.isChecked } : item))
        );
      }

      return { previousData };
    },
    onError: (_err, _itemId, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        for (const [keyStr, data] of Object.entries(context.previousData)) {
          queryClient.setQueryData(JSON.parse(keyStr), data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_ITEMS_KEY });
    },
  });
}

export function useAddManualItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      name,
      quantity,
      unit,
      category,
    }: {
      listId: string;
      name: string;
      quantity?: number;
      unit?: string;
      category?: IngredientCategoryCode;
    }) => shoppingDb.addManualItem(listId, name, quantity, unit, category),
    onSuccess: (item) => {
      queryClient.invalidateQueries({
        queryKey: [...SHOPPING_LIST_ITEMS_KEY, item.shoppingListId],
      });
    },
  });
}

export function useClearCheckedItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => shoppingDb.clearCheckedItems(listId),
    onSuccess: (_, listId) => {
      queryClient.invalidateQueries({
        queryKey: [...SHOPPING_LIST_ITEMS_KEY, listId],
      });
    },
  });
}
