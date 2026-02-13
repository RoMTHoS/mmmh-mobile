import * as SQLite from 'expo-sqlite';
import uuid from 'react-native-uuid';
import type { Recipe, CreateRecipeInput, UpdateRecipeInput } from '../types';

const DATABASE_NAME = 'mmmh.db';
const CURRENT_VERSION = 2;

let db: SQLite.SQLiteDatabase | null = null;

interface RecipeRow {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  cookingTime: number | null;
  servings: number | null;
  photoUri: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SchemaVersion {
  version: number;
}

function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DATABASE_NAME);
  }
  return db;
}

function deserializeRecipe(row: RecipeRow): Recipe {
  return {
    ...row,
    ingredients: JSON.parse(row.ingredients),
    steps: JSON.parse(row.steps),
  };
}

export async function initializeDatabase(): Promise<void> {
  const database = getDatabase();

  try {
    const result = database.getFirstSync<SchemaVersion>(
      'SELECT version FROM schema_version LIMIT 1'
    );
    const currentVersion = result?.version ?? 0;

    if (currentVersion < CURRENT_VERSION) {
      await runMigrations(currentVersion);
    }
  } catch {
    // Table doesn't exist yet, run migrations from scratch
    await runMigrations(0);
  }
}

async function runMigrations(fromVersion: number): Promise<void> {
  const database = getDatabase();

  if (fromVersion < 1) {
    database.execSync(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        steps TEXT NOT NULL,
        cookingTime INTEGER,
        servings INTEGER,
        photoUri TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_recipes_createdAt ON recipes(createdAt DESC);

      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      );

      INSERT INTO schema_version (version) VALUES (1);
    `);
  }

  if (fromVersion < 2) {
    database.execSync(`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Liste de courses',
        is_active INTEGER NOT NULL DEFAULT 1,
        meal_count INTEGER DEFAULT 0,
        price_estimate_min REAL,
        price_estimate_max REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS shopping_list_recipes (
        id TEXT PRIMARY KEY,
        shopping_list_id TEXT NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        servings_multiplier REAL NOT NULL DEFAULT 1.0,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(shopping_list_id, recipe_id)
      );

      CREATE TABLE IF NOT EXISTS shopping_list_items (
        id TEXT PRIMARY KEY,
        shopping_list_id TEXT NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        quantity REAL,
        unit TEXT,
        category TEXT CHECK (category IN ('produce', 'dairy', 'meat', 'seafood', 'pantry', 'frozen', 'other')),
        source_type TEXT NOT NULL CHECK (source_type IN ('recipe', 'manual')),
        source_recipe_ids TEXT,
        is_checked INTEGER NOT NULL DEFAULT 0,
        is_excluded INTEGER NOT NULL DEFAULT 0,
        checked_at TEXT,
        estimated_price REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_shopping_lists_active ON shopping_lists(is_active);
      CREATE INDEX IF NOT EXISTS idx_shopping_list_recipes_list ON shopping_list_recipes(shopping_list_id);
      CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);
      CREATE INDEX IF NOT EXISTS idx_shopping_list_items_category ON shopping_list_items(category);
      CREATE INDEX IF NOT EXISTS idx_shopping_list_items_checked ON shopping_list_items(is_checked);

      UPDATE schema_version SET version = 2;
    `);
  }
}

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const database = getDatabase();
  const id = uuid.v4() as string;
  const now = new Date().toISOString();

  const recipe: Recipe = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };

  try {
    database.runSync(
      `INSERT INTO recipes (id, title, ingredients, steps, cookingTime, servings, photoUri, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipe.id,
        recipe.title,
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.steps),
        recipe.cookingTime,
        recipe.servings,
        recipe.photoUri,
        recipe.notes,
        recipe.createdAt,
        recipe.updatedAt,
      ]
    );

    return recipe;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Failed to save recipe. ${message}`);
  }
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const database = getDatabase();

  try {
    const row = database.getFirstSync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id]);

    if (!row) return null;

    return deserializeRecipe(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Failed to load recipe. ${message}`);
  }
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const database = getDatabase();

  try {
    const rows = database.getAllSync<RecipeRow>('SELECT * FROM recipes ORDER BY createdAt DESC');

    return rows.map(deserializeRecipe);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Failed to load recipes. ${message}`);
  }
}

export async function updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe> {
  const database = getDatabase();
  const existing = await getRecipeById(id);

  if (!existing) {
    throw new Error('Recipe not found');
  }

  const updated: Recipe = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  try {
    database.runSync(
      `UPDATE recipes SET
        title = ?, ingredients = ?, steps = ?, cookingTime = ?,
        servings = ?, photoUri = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      [
        updated.title,
        JSON.stringify(updated.ingredients),
        JSON.stringify(updated.steps),
        updated.cookingTime,
        updated.servings,
        updated.photoUri,
        updated.notes,
        updated.updatedAt,
        id,
      ]
    );

    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Failed to update recipe. ${message}`);
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  const database = getDatabase();

  try {
    database.runSync('DELETE FROM recipes WHERE id = ?', [id]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Failed to delete recipe. ${message}`);
  }
}

export async function getRecipeCount(): Promise<number> {
  const database = getDatabase();

  try {
    const result = database.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM recipes'
    );
    return result?.count ?? 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Failed to count recipes. ${message}`);
  }
}

// For testing purposes
export function resetDatabase(): void {
  if (db) {
    db.closeSync();
    db = null;
  }
}

export { getDatabase };
