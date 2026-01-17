import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useRecipe, useUpdateRecipe } from '../../../src/hooks';
import { LoadingScreen, TextInput, Button } from '../../../src/components/ui';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading } = useRecipe(id);
  const updateRecipe = useUpdateRecipe();

  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [servings, setServings] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setIngredients(
        recipe.ingredients
          .map((i) => [i.quantity, i.unit, i.name].filter(Boolean).join(' '))
          .join('\n')
      );
      setSteps(recipe.steps.map((s) => s.instruction).join('\n'));
      setCookingTime(recipe.cookingTime?.toString() ?? '');
      setServings(recipe.servings?.toString() ?? '');
      setNotes(recipe.notes ?? '');
    }
  }, [recipe]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!ingredients.trim()) {
      newErrors.ingredients = 'At least one ingredient is required';
    }
    if (!steps.trim()) {
      newErrors.steps = 'At least one step is required';
    }
    if (cookingTime && isNaN(parseInt(cookingTime, 10))) {
      newErrors.cookingTime = 'Must be a number';
    }
    if (servings && isNaN(parseInt(servings, 10))) {
      newErrors.servings = 'Must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await updateRecipe.mutateAsync({
        id,
        input: {
          title: title.trim(),
          ingredients: ingredients
            .split('\n')
            .filter((i) => i.trim())
            .map((line) => ({ name: line.trim(), quantity: null, unit: null })),
          steps: steps
            .split('\n')
            .filter((s) => s.trim())
            .map((instruction, index) => ({ order: index + 1, instruction: instruction.trim() })),
          cookingTime: cookingTime ? parseInt(cookingTime, 10) : null,
          servings: servings ? parseInt(servings, 10) : null,
          notes: notes.trim() || null,
        },
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update recipe');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!recipe) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              title="Save"
              onPress={handleSave}
              loading={updateRecipe.isPending}
              style={styles.saveButton}
            />
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe name"
          error={errors.title}
        />

        <TextInput
          label="Ingredients"
          value={ingredients}
          onChangeText={setIngredients}
          placeholder="One ingredient per line"
          multiline
          error={errors.ingredients}
          style={styles.multiline}
        />

        <TextInput
          label="Instructions"
          value={steps}
          onChangeText={setSteps}
          placeholder="One step per line"
          multiline
          error={errors.steps}
          style={styles.multiline}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              label="Cooking Time (min)"
              value={cookingTime}
              onChangeText={setCookingTime}
              placeholder="30"
              keyboardType="numeric"
              error={errors.cookingTime}
            />
          </View>
          <View style={styles.halfInput}>
            <TextInput
              label="Servings"
              value={servings}
              onChangeText={setServings}
              placeholder="4"
              keyboardType="numeric"
              error={errors.servings}
            />
          </View>
        </View>

        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          style={styles.multiline}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  multiline: {
    minHeight: 120,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
});
