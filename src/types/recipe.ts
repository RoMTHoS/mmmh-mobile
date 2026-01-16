// Recipe domain types for local SQLite storage

export interface Ingredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

export interface Step {
  order: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
  cookingTime: number | null;
  servings: number | null;
  photoUri: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateRecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateRecipeInput = Partial<CreateRecipeInput>;
