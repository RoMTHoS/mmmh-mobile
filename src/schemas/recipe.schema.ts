import { z } from 'zod';

export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  ingredientsText: z.string().optional(),
  stepsText: z.string().optional(),
  cookingTime: z.number().min(1).optional().nullable(),
  servings: z.number().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateRecipeFormData = z.infer<typeof createRecipeSchema>;
