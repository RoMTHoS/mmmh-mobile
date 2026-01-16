/**
 * DatabaseTestScreen - Temporary component for manual testing of Story 1.5
 *
 * This screen allows you to test all CRUD operations on the SQLite database.
 * DELETE THIS FILE after testing is complete.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe } from '../hooks';
import type { Recipe } from '../types';

export function DatabaseTestScreen(): React.JSX.Element {
  const [log, setLog] = useState<string[]>([]);

  const { data: recipes, isLoading, error, refetch } = useRecipes();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleCreateRecipe = async () => {
    const randomNum = Math.floor(Math.random() * 1000);
    addLog(`Creating recipe #${randomNum}...`);

    try {
      const result = await createRecipe.mutateAsync({
        title: `Test Recipe #${randomNum}`,
        ingredients: [
          { name: 'Flour', quantity: '2', unit: 'cups' },
          { name: 'Sugar', quantity: '1', unit: 'cup' },
          { name: 'Eggs', quantity: '2', unit: null },
        ],
        steps: [
          { order: 1, instruction: 'Mix dry ingredients' },
          { order: 2, instruction: 'Add wet ingredients' },
          { order: 3, instruction: 'Bake at 350F for 30 minutes' },
        ],
        cookingTime: 45,
        servings: 8,
        photoUri: null,
        notes: `Created at ${new Date().toISOString()}`,
      });
      addLog(`Created: ${result.title} (ID: ${result.id.slice(0, 8)}...)`);
    } catch (err) {
      addLog(`ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateFirstRecipe = async () => {
    if (!recipes || recipes.length === 0) {
      addLog('No recipes to update');
      return;
    }

    const first = recipes[0];
    const newTitle = `Updated: ${first.title.replace('Updated: ', '')}`;
    addLog(`Updating "${first.title}" -> "${newTitle}"...`);

    try {
      const result = await updateRecipe.mutateAsync({
        id: first.id,
        input: {
          title: newTitle,
          notes: `Updated at ${new Date().toISOString()}`,
        },
      });
      addLog(`Updated: ${result.title}`);
    } catch (err) {
      addLog(`ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteFirstRecipe = async () => {
    if (!recipes || recipes.length === 0) {
      addLog('No recipes to delete');
      return;
    }

    const first = recipes[0];
    addLog(`Deleting "${first.title}"...`);

    try {
      await deleteRecipe.mutateAsync(first.id);
      addLog(`Deleted: ${first.title}`);
    } catch (err) {
      addLog(`ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteAll = () => {
    if (!recipes || recipes.length === 0) {
      addLog('No recipes to delete');
      return;
    }

    Alert.alert(
      'Delete All Recipes',
      `Are you sure you want to delete all ${recipes.length} recipes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            addLog(`Deleting ${recipes.length} recipes...`);
            for (const recipe of recipes) {
              await deleteRecipe.mutateAsync(recipe.id);
            }
            addLog('All recipes deleted');
          },
        },
      ]
    );
  };

  const handleCreate100Recipes = async () => {
    addLog('Creating 100 recipes for performance test...');
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      await createRecipe.mutateAsync({
        title: `Bulk Recipe #${i + 1}`,
        ingredients: [
          { name: 'Ingredient 1', quantity: '1', unit: 'cup' },
          { name: 'Ingredient 2', quantity: '2', unit: 'tbsp' },
        ],
        steps: [
          { order: 1, instruction: 'Step 1' },
          { order: 2, instruction: 'Step 2' },
        ],
        cookingTime: 30,
        servings: 4,
        photoUri: null,
        notes: null,
      });

      if ((i + 1) % 25 === 0) {
        addLog(`Progress: ${i + 1}/100 recipes created`);
      }
    }

    const duration = Date.now() - start;
    addLog(`Created 100 recipes in ${duration}ms`);
  };

  const handleMeasureQuery = async () => {
    addLog('Measuring getAllRecipes query time...');
    const start = Date.now();
    await refetch();
    const duration = Date.now() - start;
    const count = recipes?.length ?? 0;
    const passed = duration < 100;
    addLog(
      `Query time: ${duration}ms for ${count} recipes ${passed ? '(PASS)' : '(FAIL - should be <100ms)'}`
    );
  };

  const renderRecipe = (recipe: Recipe, index: number) => (
    <View key={recipe.id} style={styles.recipeCard}>
      <Text style={styles.recipeTitle}>
        {index + 1}. {recipe.title}
      </Text>
      <Text style={styles.recipeDetail}>
        ID: {recipe.id.slice(0, 8)}... | {recipe.ingredients.length} ingredients |{' '}
        {recipe.steps.length} steps
      </Text>
      <Text style={styles.recipeDetail}>
        Time: {recipe.cookingTime ?? 'N/A'}min | Servings: {recipe.servings ?? 'N/A'}
      </Text>
      <Text style={styles.recipeDetail}>
        Created: {new Date(recipe.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SQLite Database Test (Story 1.5)</Text>

      {/* Status */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isLoading
            ? 'Loading...'
            : error
              ? `Error: ${error.message}`
              : `${recipes?.length ?? 0} recipes in database`}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.buttonCreate]} onPress={handleCreateRecipe}>
          <Text style={styles.buttonText}>Create 1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonUpdate]}
          onPress={handleUpdateFirstRecipe}
        >
          <Text style={styles.buttonText}>Update 1st</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonDelete]}
          onPress={handleDeleteFirstRecipe}
        >
          <Text style={styles.buttonText}>Delete 1st</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPerf]}
          onPress={handleCreate100Recipes}
        >
          <Text style={styles.buttonText}>Create 100</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonPerf]} onPress={handleMeasureQuery}>
          <Text style={styles.buttonText}>Measure Query</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonDelete]} onPress={handleDeleteAll}>
          <Text style={styles.buttonText}>Delete All</Text>
        </TouchableOpacity>
      </View>

      {/* Log Output */}
      <View style={styles.logContainer}>
        <Text style={styles.logHeader}>Log:</Text>
        <ScrollView style={styles.logScroll}>
          {log.map((entry, i) => (
            <Text key={i} style={styles.logEntry}>
              {entry}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* Recipe List */}
      <View style={styles.recipesContainer}>
        <Text style={styles.logHeader}>Recipes:</Text>
        <ScrollView style={styles.recipesScroll}>
          {recipes?.map((recipe, index) => renderRecipe(recipe, index))}
          {(!recipes || recipes.length === 0) && (
            <Text style={styles.emptyText}>No recipes. Tap "Create 1" to add one.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusBar: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonCreate: {
    backgroundColor: '#4CAF50',
  },
  buttonUpdate: {
    backgroundColor: '#2196F3',
  },
  buttonDelete: {
    backgroundColor: '#f44336',
  },
  buttonPerf: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  logHeader: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logScroll: {
    flex: 1,
  },
  logEntry: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 2,
  },
  recipesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
  },
  recipesScroll: {
    flex: 1,
  },
  recipeCard: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  recipeTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recipeDetail: {
    fontSize: 11,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
