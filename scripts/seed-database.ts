/**
 * Database Seed Script
 *
 * This script seeds the database with sample recipes for performance testing.
 * Run this in the app context (e.g., via a dev-only button) to test with realistic data.
 *
 * Usage: Import and call seedDatabase() from a component during development.
 */

import { createRecipe, getAllRecipes, getRecipeCount } from '../src/services/database';
import type { CreateRecipeInput } from '../src/types';

const RECIPE_COUNT = 150;

const SAMPLE_INGREDIENTS = [
  { name: 'All-purpose flour', quantity: '2', unit: 'cups' },
  { name: 'Sugar', quantity: '1', unit: 'cup' },
  { name: 'Butter', quantity: '1/2', unit: 'cup' },
  { name: 'Eggs', quantity: '2', unit: null },
  { name: 'Milk', quantity: '1', unit: 'cup' },
  { name: 'Salt', quantity: '1', unit: 'tsp' },
  { name: 'Baking powder', quantity: '2', unit: 'tsp' },
  { name: 'Vanilla extract', quantity: '1', unit: 'tsp' },
];

const SAMPLE_CUISINES = [
  'Italian',
  'Mexican',
  'Japanese',
  'French',
  'Indian',
  'Thai',
  'Greek',
  'American',
];

function generateRecipe(index: number): CreateRecipeInput {
  const numIngredients = Math.floor(Math.random() * 6) + 3;
  const numSteps = Math.floor(Math.random() * 5) + 3;
  const cuisine = SAMPLE_CUISINES[index % SAMPLE_CUISINES.length];

  return {
    title: `${cuisine} Recipe #${index + 1}`,
    ingredients: SAMPLE_INGREDIENTS.slice(0, numIngredients).map((ing) => ({
      ...ing,
    })),
    steps: Array.from({ length: numSteps }, (_, i) => ({
      order: i + 1,
      instruction: `Step ${i + 1}: Perform cooking action for ${cuisine} dish. This step involves careful preparation and attention to detail.`,
    })),
    cookingTime: Math.floor(Math.random() * 60) + 15,
    servings: Math.floor(Math.random() * 6) + 2,
    photoUri: null,
    notes: index % 3 === 0 ? `Special notes for recipe ${index + 1}` : null,
  };
}

export async function seedDatabase(): Promise<{ count: number; duration: number }> {
  const existingCount = await getRecipeCount();

  if (existingCount >= RECIPE_COUNT) {
    return { count: existingCount, duration: 0 };
  }

  const recipesToCreate = RECIPE_COUNT - existingCount;
  const startTime = Date.now();

  for (let i = 0; i < recipesToCreate; i++) {
    await createRecipe(generateRecipe(existingCount + i));
  }

  const duration = Date.now() - startTime;

  return { count: RECIPE_COUNT, duration };
}

export async function measureQueryPerformance(): Promise<{
  count: number;
  queryTimeMs: number;
}> {
  const startTime = Date.now();
  const recipes = await getAllRecipes();
  const queryTimeMs = Date.now() - startTime;

  return { count: recipes.length, queryTimeMs };
}

export interface PerformanceTestResult {
  seedCount: number;
  seedDurationMs: number;
  queryCount: number;
  queryTimeMs: number;
  passed: boolean;
}

export async function runPerformanceTest(): Promise<PerformanceTestResult> {
  const seedResult = await seedDatabase();
  const perfResult = await measureQueryPerformance();

  return {
    seedCount: seedResult.count,
    seedDurationMs: seedResult.duration,
    queryCount: perfResult.count,
    queryTimeMs: perfResult.queryTimeMs,
    passed: perfResult.queryTimeMs < 100,
  };
}
