import uuid from 'react-native-uuid';
import { getDatabase } from '../services/database';
import type { AggregatedIngredient, IngredientCategoryCode, RecipeWithServings } from '../types';

// --- Ingredient name normalization ---

export function normalizeIngredientName(name: string): string {
  let normalized = name.toLowerCase().trim();

  if (normalized.length > 3) {
    // English -ies → -y (berries → berry)
    if (normalized.endsWith('ies')) {
      normalized = normalized.slice(0, -3) + 'y';
    }
    // English -oes, -shes, -ches, -xes, -zes → strip -es
    else if (
      normalized.endsWith('oes') ||
      normalized.endsWith('shes') ||
      normalized.endsWith('ches') ||
      normalized.endsWith('xes') ||
      normalized.endsWith('zes')
    ) {
      normalized = normalized.slice(0, -2);
    }
    // French -aux → -al (journaux → journal)
    else if (normalized.endsWith('aux')) {
      normalized = normalized.slice(0, -3) + 'al';
    }
    // General -s plural (French "tomates" → "tomate", English "carrots" → "carrot")
    else if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
      normalized = normalized.slice(0, -1);
    }
  }

  return normalized;
}

// --- Ingredient categorization ---

const CATEGORY_KEYWORDS: Record<IngredientCategoryCode, string[]> = {
  produce: [
    'tomate',
    'oignon',
    'ail',
    'carotte',
    'pomme de terre',
    'poivron',
    'courgette',
    'aubergine',
    'salade',
    'laitue',
    'épinard',
    'brocoli',
    'chou',
    'haricot vert',
    'petit pois',
    'champignon',
    'persil',
    'ciboulette',
    'basilic',
    'thym',
    'romarin',
    'menthe',
    'coriandre',
    'citron',
    'orange',
    'pomme',
    'banane',
    'fraise',
    'framboise',
    'myrtille',
    'avocat',
    'concombre',
    'céleri',
    'fenouil',
    'artichaut',
    'navet',
    'radis',
    'échalote',
    'poireau',
    'gingembre',
    'piment',
    // English
    'tomato',
    'onion',
    'garlic',
    'carrot',
    'potato',
    'pepper',
    'zucchini',
    'eggplant',
    'lettuce',
    'spinach',
    'broccoli',
    'cabbage',
    'mushroom',
    'parsley',
    'basil',
    'thyme',
    'rosemary',
    'mint',
    'cilantro',
    'lemon',
    'apple',
    'banana',
    'strawberry',
    'avocado',
    'cucumber',
    'celery',
    'ginger',
  ],
  dairy: [
    'lait',
    'beurre',
    'crème',
    'fromage',
    'yaourt',
    'yogourt',
    'mascarpone',
    'mozzarella',
    'parmesan',
    'gruyère',
    'emmental',
    'comté',
    'roquefort',
    'chèvre',
    'ricotta',
    'crème fraîche',
    // English
    'milk',
    'butter',
    'cream',
    'cheese',
    'yogurt',
    'sour cream',
  ],
  meat: [
    'poulet',
    'boeuf',
    'bœuf',
    'porc',
    'veau',
    'agneau',
    'canard',
    'dinde',
    'jambon',
    'lard',
    'lardon',
    'saucisse',
    'merguez',
    'steak',
    'escalope',
    'cuisse',
    'filet',
    'côtelette',
    'bacon',
    // English
    'chicken',
    'beef',
    'pork',
    'lamb',
    'turkey',
    'duck',
    'ham',
    'sausage',
  ],
  seafood: [
    'poisson',
    'saumon',
    'thon',
    'cabillaud',
    'crevette',
    'moule',
    'huître',
    'calmar',
    'poulpe',
    'sardine',
    'maquereau',
    'truite',
    'bar',
    'dorade',
    'crabe',
    'homard',
    'langoustine',
    'anchois',
    // English
    'fish',
    'salmon',
    'tuna',
    'cod',
    'shrimp',
    'prawn',
    'mussel',
    'oyster',
    'squid',
    'crab',
    'lobster',
  ],
  pantry: [
    'farine',
    'sucre',
    'sel',
    'poivre',
    'huile',
    'vinaigre',
    'moutarde',
    'ketchup',
    'sauce soja',
    'pâte',
    'riz',
    'spaghetti',
    'penne',
    'nouille',
    'pain',
    'chapelure',
    'levure',
    'bicarbonate',
    'maïzena',
    'fécule',
    'bouillon',
    'conserve',
    'tomate pelée',
    'concentré',
    'olive',
    'câpre',
    'cornichon',
    'noix',
    'amande',
    'noisette',
    'chocolat',
    'cacao',
    'vanille',
    'cannelle',
    'cumin',
    'paprika',
    'curry',
    'curcuma',
    'miel',
    'confiture',
    'sirop',
    // English
    'flour',
    'sugar',
    'salt',
    'pepper',
    'oil',
    'vinegar',
    'mustard',
    'soy sauce',
    'pasta',
    'rice',
    'bread',
    'yeast',
    'broth',
    'stock',
    'honey',
    'chocolate',
    'vanilla',
    'cinnamon',
    'cumin',
    'paprika',
    'olive oil',
    'vegetable oil',
  ],
  frozen: [
    'surgelé',
    'congelé',
    'glace',
    'sorbet',
    // English
    'frozen',
    'ice cream',
  ],
  other: [],
};

export function categorizeIngredient(name: string): IngredientCategoryCode {
  const normalized = name.toLowerCase().trim();

  // Check each category for keyword matches
  const categories: IngredientCategoryCode[] = [
    'produce',
    'dairy',
    'meat',
    'seafood',
    'pantry',
    'frozen',
  ];

  for (const category of categories) {
    for (const keyword of CATEGORY_KEYWORDS[category]) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return 'other';
}

// --- Quantity aggregation ---

export function aggregateIngredients(recipes: RecipeWithServings[]): AggregatedIngredient[] {
  // Map: normalizedName -> AggregatedIngredient (with unit variants)
  const aggregated = new Map<string, Map<string, AggregatedIngredient>>();

  for (const recipe of recipes) {
    const scale = recipe.servingsMultiplier;

    for (const ingredient of recipe.ingredients) {
      const normalizedName = normalizeIngredientName(ingredient.name);
      const unitKey = (ingredient.unit ?? '').toLowerCase().trim();
      const parsedQty = ingredient.quantity != null ? parseFloat(ingredient.quantity) : null;
      const scaledQty = parsedQty != null && !isNaN(parsedQty) ? parsedQty * scale : null;

      if (!aggregated.has(normalizedName)) {
        aggregated.set(normalizedName, new Map());
      }
      const unitMap = aggregated.get(normalizedName)!;

      if (unitMap.has(unitKey)) {
        const existing = unitMap.get(unitKey)!;
        // Sum quantities if both have values
        if (existing.quantity != null && scaledQty != null) {
          existing.quantity += scaledQty;
        } else if (existing.quantity == null && scaledQty != null) {
          // One has quantity, other doesn't — keep as separate? No, update with the one that has it
          existing.quantity = scaledQty;
        }
        // Merge source recipe IDs
        if (!existing.sourceRecipeIds.includes(recipe.recipeId)) {
          existing.sourceRecipeIds.push(recipe.recipeId);
        }
      } else {
        unitMap.set(unitKey, {
          name: ingredient.name, // Keep original casing of first occurrence
          quantity: scaledQty,
          unit: ingredient.unit ?? null,
          category: categorizeIngredient(ingredient.name),
          sourceRecipeIds: [recipe.recipeId],
          isChecked: false,
        });
      }
    }
  }

  // Flatten: each unit variant is a separate aggregated item
  const result: AggregatedIngredient[] = [];
  for (const unitMap of aggregated.values()) {
    for (const item of unitMap.values()) {
      result.push(item);
    }
  }

  // Sort by category, then name
  result.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  return result;
}

// --- Regenerate shopping list items from recipes ---

export async function regenerateShoppingListItems(listId: string): Promise<void> {
  const database = getDatabase();

  try {
    // Get all recipes in this list with their ingredients
    const recipeRows = database.getAllSync<{
      recipe_id: string;
      servings_multiplier: number;
      ingredients: string;
      servings: number | null;
    }>(
      `SELECT slr.recipe_id, slr.servings_multiplier, r.ingredients, r.servings
       FROM shopping_list_recipes slr
       JOIN recipes r ON slr.recipe_id = r.id
       WHERE slr.shopping_list_id = ?`,
      [listId]
    );

    const recipesWithServings: RecipeWithServings[] = recipeRows.map((row) => ({
      recipeId: row.recipe_id,
      servingsMultiplier: row.servings_multiplier,
      originalServings: row.servings,
      ingredients: JSON.parse(row.ingredients),
    }));

    // Get excluded item keys (normalized name + unit) to preserve exclusions
    const excludedRows = database.getAllSync<{ name: string; unit: string | null }>(
      `SELECT name, unit FROM shopping_list_items
       WHERE shopping_list_id = ? AND source_type = 'recipe' AND is_excluded = 1`,
      [listId]
    );
    const excludedKeys = new Set(
      excludedRows.map(
        (r) => `${normalizeIngredientName(r.name)}|${(r.unit ?? '').toLowerCase().trim()}`
      )
    );

    // Delete non-excluded recipe-sourced items (they'll be regenerated)
    database.runSync(
      `DELETE FROM shopping_list_items
       WHERE shopping_list_id = ? AND source_type = 'recipe' AND is_excluded = 0`,
      [listId]
    );

    // Aggregate and insert new items
    const aggregated = aggregateIngredients(recipesWithServings);
    const now = new Date().toISOString();

    for (const item of aggregated) {
      const itemKey = `${normalizeIngredientName(item.name)}|${(item.unit ?? '').toLowerCase().trim()}`;

      // Skip if this item was excluded
      if (excludedKeys.has(itemKey)) continue;

      const id = uuid.v4() as string;
      database.runSync(
        `INSERT INTO shopping_list_items
          (id, shopping_list_id, name, quantity, unit, category, source_type, source_recipe_ids, is_checked, is_excluded, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'recipe', ?, 0, 0, ?, ?)`,
        [
          id,
          listId,
          item.name,
          item.quantity,
          item.unit,
          item.category,
          JSON.stringify(item.sourceRecipeIds),
          now,
          now,
        ]
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de régénérer les articles. ${message}`);
  }
}
