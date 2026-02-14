// Shopping list domain types for local SQLite storage

export type IngredientCategoryCode =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'pantry'
  | 'frozen'
  | 'other';

export const INGREDIENT_CATEGORIES: Record<IngredientCategoryCode, string> = {
  produce: 'Fruits et légumes',
  dairy: 'Produits laitiers',
  meat: 'Viandes',
  seafood: 'Poissons',
  pantry: 'Épicerie',
  frozen: 'Surgelés',
  other: 'Autre',
};

export interface ShoppingList {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  mealCount: number;
  priceEstimateMin: number | null;
  priceEstimateMax: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListRecipe {
  id: string;
  shoppingListId: string;
  recipeId: string;
  servingsMultiplier: number;
  addedAt: string;
  // Joined fields (from recipes table)
  recipeTitle?: string;
  recipePhotoUri?: string | null;
}

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategoryCode | null;
  sourceType: 'recipe' | 'manual';
  sourceRecipeIds: string[] | null;
  isChecked: boolean;
  isExcluded: boolean;
  checkedAt: string | null;
  estimatedPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AggregatedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategoryCode;
  sourceRecipeIds: string[];
  isChecked: boolean;
}

export interface RecipeWithServings {
  recipeId: string;
  servingsMultiplier: number;
  originalServings: number | null;
  ingredients: { name: string; quantity: string | null; unit: string | null }[];
}
