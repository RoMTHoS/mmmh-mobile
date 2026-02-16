import uuid from 'react-native-uuid';
import { getDatabase } from './database';
import type {
  ShoppingList,
  ShoppingListRecipe,
  ShoppingListItem,
  IngredientCategoryCode,
} from '../types';

// --- Row types for SQLite deserialization ---

interface ShoppingListRow {
  id: string;
  name: string;
  is_active: number;
  is_default: number;
  meal_count: number;
  price_estimate_min: number | null;
  price_estimate_max: number | null;
  created_at: string;
  updated_at: string;
}

interface ShoppingListRecipeRow {
  id: string;
  shopping_list_id: string;
  recipe_id: string;
  servings_multiplier: number;
  added_at: string;
  recipe_title?: string;
  recipe_photo_uri?: string | null;
}

interface ShoppingListItemRow {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategoryCode | null;
  source_type: 'recipe' | 'manual';
  source_recipe_ids: string | null;
  is_checked: number;
  is_excluded: number;
  checked_at: string | null;
  estimated_price: number | null;
  created_at: string;
  updated_at: string;
}

// --- Deserializers ---

function deserializeList(row: ShoppingListRow): ShoppingList {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active === 1,
    isDefault: row.is_default === 1,
    mealCount: row.meal_count,
    priceEstimateMin: row.price_estimate_min,
    priceEstimateMax: row.price_estimate_max,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deserializeRecipeEntry(row: ShoppingListRecipeRow): ShoppingListRecipe {
  return {
    id: row.id,
    shoppingListId: row.shopping_list_id,
    recipeId: row.recipe_id,
    servingsMultiplier: row.servings_multiplier,
    addedAt: row.added_at,
    recipeTitle: row.recipe_title,
    recipePhotoUri: row.recipe_photo_uri ?? null,
  };
}

function deserializeItem(row: ShoppingListItemRow): ShoppingListItem {
  return {
    id: row.id,
    shoppingListId: row.shopping_list_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    category: row.category,
    sourceType: row.source_type,
    sourceRecipeIds: row.source_recipe_ids ? JSON.parse(row.source_recipe_ids) : null,
    isChecked: row.is_checked === 1,
    isExcluded: row.is_excluded === 1,
    checkedAt: row.checked_at,
    estimatedPrice: row.estimated_price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// --- Shopping List CRUD ---

export async function createShoppingList(
  name?: string,
  isDefault: boolean = false
): Promise<ShoppingList> {
  const database = getDatabase();
  const id = uuid.v4() as string;
  const now = new Date().toISOString();

  try {
    database.runSync(
      `INSERT INTO shopping_lists (id, name, is_active, is_default, meal_count, created_at, updated_at)
       VALUES (?, ?, 1, ?, 0, ?, ?)`,
      [id, name ?? 'Ma liste de courses', isDefault ? 1 : 0, now, now]
    );

    return {
      id,
      name: name ?? 'Ma liste de courses',
      isActive: true,
      isDefault,
      mealCount: 0,
      priceEstimateMin: null,
      priceEstimateMax: null,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de créer la liste de courses. ${message}`);
  }
}

export async function getActiveShoppingList(): Promise<ShoppingList | null> {
  const database = getDatabase();

  try {
    const row = database.getFirstSync<ShoppingListRow>(
      'SELECT * FROM shopping_lists WHERE is_active = 1 ORDER BY is_default DESC LIMIT 1'
    );
    return row ? deserializeList(row) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger la liste de courses. ${message}`);
  }
}

export async function getDefaultShoppingList(): Promise<ShoppingList | null> {
  const database = getDatabase();

  try {
    const row = database.getFirstSync<ShoppingListRow>(
      'SELECT * FROM shopping_lists WHERE is_default = 1 LIMIT 1'
    );
    return row ? deserializeList(row) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger la liste par défaut. ${message}`);
  }
}

export async function addRecipeToList(
  listId: string,
  recipeId: string,
  servingsMultiplier: number = 1.0
): Promise<ShoppingListRecipe> {
  const database = getDatabase();
  const id = uuid.v4() as string;
  const now = new Date().toISOString();

  try {
    // UPSERT: insert or update servings_multiplier if already exists
    database.runSync(
      `INSERT INTO shopping_list_recipes (id, shopping_list_id, recipe_id, servings_multiplier, added_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(shopping_list_id, recipe_id) DO UPDATE SET servings_multiplier = excluded.servings_multiplier`,
      [id, listId, recipeId, servingsMultiplier, now]
    );

    // Update meal count
    const countResult = database.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM shopping_list_recipes WHERE shopping_list_id = ?',
      [listId]
    );
    database.runSync('UPDATE shopping_lists SET meal_count = ?, updated_at = ? WHERE id = ?', [
      countResult?.count ?? 0,
      now,
      listId,
    ]);

    return {
      id,
      shoppingListId: listId,
      recipeId,
      servingsMultiplier,
      addedAt: now,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible d'ajouter la recette. ${message}`);
  }
}

export async function removeRecipeFromList(listId: string, recipeId: string): Promise<void> {
  const database = getDatabase();
  const now = new Date().toISOString();

  try {
    // Remove associated recipe-sourced items
    database.runSync(
      `DELETE FROM shopping_list_items
       WHERE shopping_list_id = ? AND source_type = 'recipe'
         AND source_recipe_ids LIKE ?`,
      [listId, `%"${recipeId}"%`]
    );

    // Remove the recipe link
    database.runSync(
      'DELETE FROM shopping_list_recipes WHERE shopping_list_id = ? AND recipe_id = ?',
      [listId, recipeId]
    );

    // Update meal count
    const countResult = database.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM shopping_list_recipes WHERE shopping_list_id = ?',
      [listId]
    );
    database.runSync('UPDATE shopping_lists SET meal_count = ?, updated_at = ? WHERE id = ?', [
      countResult?.count ?? 0,
      now,
      listId,
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de retirer la recette. ${message}`);
  }
}

export async function getShoppingListRecipes(listId: string): Promise<ShoppingListRecipe[]> {
  const database = getDatabase();

  try {
    const rows = database.getAllSync<ShoppingListRecipeRow>(
      `SELECT slr.*, r.title as recipe_title, r.photoUri as recipe_photo_uri
       FROM shopping_list_recipes slr
       LEFT JOIN recipes r ON slr.recipe_id = r.id
       WHERE slr.shopping_list_id = ?
       ORDER BY slr.added_at DESC`,
      [listId]
    );
    return rows.map(deserializeRecipeEntry);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger les recettes de la liste. ${message}`);
  }
}

export async function addManualItem(
  listId: string,
  name: string,
  quantity?: number,
  unit?: string,
  category?: IngredientCategoryCode
): Promise<ShoppingListItem> {
  const database = getDatabase();
  const id = uuid.v4() as string;
  const now = new Date().toISOString();

  try {
    database.runSync(
      `INSERT INTO shopping_list_items
        (id, shopping_list_id, name, quantity, unit, category, source_type, is_checked, is_excluded, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'manual', 0, 0, ?, ?)`,
      [id, listId, name, quantity ?? null, unit ?? null, category ?? 'other', now, now]
    );

    return {
      id,
      shoppingListId: listId,
      name,
      quantity: quantity ?? null,
      unit: unit ?? null,
      category: category ?? 'other',
      sourceType: 'manual',
      sourceRecipeIds: null,
      isChecked: false,
      isExcluded: false,
      checkedAt: null,
      estimatedPrice: null,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible d'ajouter l'article. ${message}`);
  }
}

export async function toggleItemChecked(itemId: string): Promise<void> {
  const database = getDatabase();
  const now = new Date().toISOString();

  try {
    database.runSync(
      `UPDATE shopping_list_items
       SET is_checked = CASE WHEN is_checked = 0 THEN 1 ELSE 0 END,
           checked_at = CASE WHEN is_checked = 0 THEN ? ELSE NULL END,
           updated_at = ?
       WHERE id = ?`,
      [now, now, itemId]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de modifier l'article. ${message}`);
  }
}

export async function updateItem(
  itemId: string,
  updates: Partial<Pick<ShoppingListItem, 'name' | 'quantity' | 'unit' | 'category'>>
): Promise<void> {
  const database = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }
  if (updates.unit !== undefined) {
    fields.push('unit = ?');
    values.push(updates.unit);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(itemId);

  try {
    database.runSync(`UPDATE shopping_list_items SET ${fields.join(', ')} WHERE id = ?`, values);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de modifier l'article. ${message}`);
  }
}

export async function deleteItem(itemId: string): Promise<void> {
  const database = getDatabase();

  try {
    // For recipe-sourced items, mark as excluded instead of deleting
    const item = database.getFirstSync<ShoppingListItemRow>(
      'SELECT * FROM shopping_list_items WHERE id = ?',
      [itemId]
    );

    if (item && item.source_type === 'recipe') {
      database.runSync(
        'UPDATE shopping_list_items SET is_excluded = 1, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), itemId]
      );
    } else {
      database.runSync('DELETE FROM shopping_list_items WHERE id = ?', [itemId]);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de supprimer l'article. ${message}`);
  }
}

export async function convertItemToManual(itemId: string): Promise<void> {
  const database = getDatabase();

  try {
    database.runSync(
      `UPDATE shopping_list_items
       SET source_type = 'manual', source_recipe_ids = NULL, updated_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), itemId]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de convertir l'article. ${message}`);
  }
}

export async function clearCheckedItems(listId: string): Promise<void> {
  const database = getDatabase();

  try {
    // Delete manual checked items
    database.runSync(
      `DELETE FROM shopping_list_items
       WHERE shopping_list_id = ? AND is_checked = 1 AND source_type = 'manual'`,
      [listId]
    );
    // Exclude recipe-sourced checked items
    database.runSync(
      `UPDATE shopping_list_items
       SET is_excluded = 1, updated_at = ?
       WHERE shopping_list_id = ? AND is_checked = 1 AND source_type = 'recipe'`,
      [new Date().toISOString(), listId]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de supprimer les articles cochés. ${message}`);
  }
}

export async function getShoppingListItems(listId: string): Promise<ShoppingListItem[]> {
  const database = getDatabase();

  try {
    const rows = database.getAllSync<ShoppingListItemRow>(
      `SELECT * FROM shopping_list_items
       WHERE shopping_list_id = ? AND is_excluded = 0
       ORDER BY category ASC, name ASC`,
      [listId]
    );
    return rows.map(deserializeItem);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger les articles. ${message}`);
  }
}

// --- Multi-list CRUD (Story 4.5) ---

export async function getAllShoppingLists(activeOnly: boolean = true): Promise<ShoppingList[]> {
  const database = getDatabase();

  try {
    const query = activeOnly
      ? 'SELECT * FROM shopping_lists WHERE is_active = 1 ORDER BY is_default DESC, created_at ASC'
      : 'SELECT * FROM shopping_lists ORDER BY is_active DESC, is_default DESC, created_at ASC';
    const rows = database.getAllSync<ShoppingListRow>(query);
    return rows.map(deserializeList);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger les listes. ${message}`);
  }
}

export async function getShoppingListById(listId: string): Promise<ShoppingList | null> {
  const database = getDatabase();

  try {
    const row = database.getFirstSync<ShoppingListRow>(
      'SELECT * FROM shopping_lists WHERE id = ?',
      [listId]
    );
    return row ? deserializeList(row) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de charger la liste. ${message}`);
  }
}

export async function renameShoppingList(listId: string, name: string): Promise<void> {
  const database = getDatabase();

  try {
    database.runSync('UPDATE shopping_lists SET name = ?, updated_at = ? WHERE id = ?', [
      name,
      new Date().toISOString(),
      listId,
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de renommer la liste. ${message}`);
  }
}

export async function deleteShoppingList(listId: string): Promise<void> {
  const database = getDatabase();

  try {
    // Check if this is the default list
    const list = database.getFirstSync<ShoppingListRow>(
      'SELECT * FROM shopping_lists WHERE id = ?',
      [listId]
    );
    if (list && list.is_default === 1) {
      throw new Error('Impossible de supprimer la liste par défaut.');
    }
    database.runSync('DELETE FROM shopping_lists WHERE id = ?', [listId]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de supprimer la liste. ${message}`);
  }
}

export async function archiveShoppingList(listId: string): Promise<void> {
  const database = getDatabase();

  try {
    const list = database.getFirstSync<ShoppingListRow>(
      'SELECT * FROM shopping_lists WHERE id = ?',
      [listId]
    );
    if (list && list.is_default === 1) {
      throw new Error("Impossible d'archiver la liste par défaut.");
    }
    database.runSync('UPDATE shopping_lists SET is_active = 0, updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      listId,
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible d'archiver la liste. ${message}`);
  }
}

export async function reactivateShoppingList(listId: string): Promise<void> {
  const database = getDatabase();

  try {
    const count = await getActiveListCount();
    if (count >= 10) {
      throw new Error('Maximum 10 listes actives atteint.');
    }
    database.runSync('UPDATE shopping_lists SET is_active = 1, updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      listId,
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Maximum 10')) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de réactiver la liste. ${message}`);
  }
}

export async function getActiveListCount(): Promise<number> {
  const database = getDatabase();

  try {
    const result = database.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM shopping_lists WHERE is_active = 1'
    );
    return result?.count ?? 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible de compter les listes. ${message}`);
  }
}

export async function excludeItemsByNames(
  listId: string,
  ingredientNames: string[]
): Promise<void> {
  const database = getDatabase();
  const now = new Date().toISOString();

  try {
    for (const name of ingredientNames) {
      database.runSync(
        `UPDATE shopping_list_items
         SET is_excluded = 1, updated_at = ?
         WHERE shopping_list_id = ? AND LOWER(name) = LOWER(?) AND is_excluded = 0`,
        [now, listId, name]
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Impossible d'exclure les articles. ${message}`);
  }
}
