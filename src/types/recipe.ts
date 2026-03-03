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
  author: string | null;
  priceMin: number | null;
  priceMax: number | null;
  kcal: number | null;
  catalogue: string | null;
  regime: string | null;
  nutritionProteins: number | null;
  nutritionCarbs: number | null;
  nutritionFats: number | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateRecipeInput = Omit<
  Recipe,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'author'
  | 'priceMin'
  | 'priceMax'
  | 'kcal'
  | 'catalogue'
  | 'regime'
  | 'nutritionProteins'
  | 'nutritionCarbs'
  | 'nutritionFats'
> & {
  author?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  kcal?: number | null;
  catalogue?: string | null;
  regime?: string | null;
  nutritionProteins?: number | null;
  nutritionCarbs?: number | null;
  nutritionFats?: number | null;
};

export type UpdateRecipeInput = Partial<CreateRecipeInput>;
