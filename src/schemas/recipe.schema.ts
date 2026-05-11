import { z } from 'zod';

export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  ingredientsText: z.string().optional(),
  stepsText: z.string().optional(),
  cookingTime: z.number().min(1).optional().nullable(),
  servings: z.number().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  priceMin: z.number().min(0).optional().nullable(),
  priceMax: z.number().min(0).optional().nullable(),
  kcal: z.number().min(0).optional().nullable(),
  catalogue: z.string().optional().nullable(),
  regime: z.string().optional().nullable(),
  nutritionProteins: z.number().min(0).optional().nullable(),
  nutritionCarbs: z.number().min(0).optional().nullable(),
  nutritionFats: z.number().min(0).optional().nullable(),
});

export type CreateRecipeFormData = z.infer<typeof createRecipeSchema>;
