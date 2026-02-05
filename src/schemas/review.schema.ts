import { z } from 'zod';

export const reviewRecipeSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().nullable(),
  ingredientsText: z.string().min(1, 'Au moins un ingredient est requis'),
  stepsText: z.string().min(1, 'Au moins une etape est requise'),
  prepTime: z.number().min(1).optional().nullable(),
  cookTime: z.number().min(1).optional().nullable(),
  servings: z.number().min(1).optional().nullable(),
  photoUri: z.string().optional().nullable(),
});

export type ReviewRecipeFormData = z.infer<typeof reviewRecipeSchema>;
