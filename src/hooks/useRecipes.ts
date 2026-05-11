import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '../services/database';
import { getActiveShoppingList } from '../services/shoppingDatabase';
import { regenerateShoppingListItems } from '../utils/ingredientAggregation';
import { analytics } from '../services/analytics';
import { EVENTS } from '../utils/analyticsEvents';
import { deleteRecipeImage } from '../utils/imageCompression';
import type { CreateRecipeInput, UpdateRecipeInput } from '../types';

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: db.getAllRecipes,
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => db.getRecipeById(id),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecipeInput) => db.createRecipe(input),
    onSuccess: (recipe) => {
      analytics.track(EVENTS.RECIPE_CREATED, { recipe_id: recipe.id });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRecipeInput }) =>
      db.updateRecipe(id, input),
    onSuccess: async (recipe) => {
      analytics.track(EVENTS.RECIPE_EDITED, { recipe_id: recipe.id });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.setQueryData(['recipe', recipe.id], recipe);

      // Regenerate shopping list items if recipe is in an active list
      try {
        const activeList = await getActiveShoppingList();
        if (activeList) {
          await regenerateShoppingListItems(activeList.id);
          queryClient.invalidateQueries({ queryKey: ['shopping-list-items'] });
        }
      } catch {
        // Shopping list regeneration is best-effort
      }
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch photoUri before deleting the DB row
      const recipe = await db.getRecipeById(id);
      await db.deleteRecipe(id);
      if (recipe?.photoUri) {
        await deleteRecipeImage(recipe.photoUri);
      }
    },
    onSuccess: (_, id) => {
      analytics.track(EVENTS.RECIPE_DELETED, { recipe_id: id });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.removeQueries({ queryKey: ['recipe', id] });
    },
  });
}
