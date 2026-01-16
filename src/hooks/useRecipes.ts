import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '../services/database';
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRecipeInput }) =>
      db.updateRecipe(id, input),
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.setQueryData(['recipe', recipe.id], recipe);
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteRecipe(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.removeQueries({ queryKey: ['recipe', id] });
    },
  });
}
