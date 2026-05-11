import { useState, useEffect } from 'react';
import { StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToastStore } from '../../../src/stores/toastStore';

import { useRecipe, useUpdateRecipe, useDeleteRecipe } from '../../../src/hooks';
import { LoadingScreen, Text } from '../../../src/components/ui';
import { RecipeForm } from '../../../src/components/recipes';
import type { ParsedIngredient } from '../../../src/components/recipes/IngredientEditor';
import { createRecipeSchema, type CreateRecipeFormData } from '../../../src/schemas/recipe.schema';
import type { Ingredient, Step } from '../../../src/types';
import { colors, spacing, fonts } from '../../../src/theme';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading } = useRecipe(id);
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const showToast = useToastStore((s) => s.showToast);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [originalPhotoUri, setOriginalPhotoUri] = useState<string | null>(null);
  const [structuredIngredients, setStructuredIngredients] = useState<ParsedIngredient[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateRecipeFormData>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      title: '',
      ingredientsText: '',
      stepsText: '',
      cookingTime: null,
      servings: null,
      notes: '',
      author: null,
      priceMin: null,
      priceMax: null,
      kcal: null,
      catalogue: null,
      regime: null,
      nutritionProteins: null,
      nutritionCarbs: null,
      nutritionFats: null,
    },
  });

  // Pre-populate form when recipe loads
  useEffect(() => {
    if (recipe) {
      reset({
        title: recipe.title,
        ingredientsText: ingredientsToText(recipe.ingredients),
        stepsText: stepsToText(recipe.steps),
        cookingTime: recipe.cookingTime,
        servings: recipe.servings,
        notes: recipe.notes || '',
        author: recipe.author,
        priceMin: recipe.priceMin,
        priceMax: recipe.priceMax,
        kcal: recipe.kcal,
        catalogue: recipe.catalogue,
        regime: recipe.regime,
        nutritionProteins: recipe.nutritionProteins,
        nutritionCarbs: recipe.nutritionCarbs,
        nutritionFats: recipe.nutritionFats,
      });
      setPhotoUri(recipe.photoUri);
      setOriginalPhotoUri(recipe.photoUri);
    }
  }, [recipe, reset]);

  const hasPhotoChanges = photoRemoved || photoUri !== originalPhotoUri;
  const hasChanges = isDirty || hasPhotoChanges;

  const handlePhotoChange = (uri: string | null) => {
    setPhotoUri(uri);
    if (uri === null) {
      setPhotoRemoved(true);
    } else {
      setPhotoRemoved(false);
    }
  };

  const ingredientsFromStructured = (): Ingredient[] => {
    return structuredIngredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity.trim() || null,
        unit: i.unit.trim() || null,
      }));
  };

  const parseSteps = (text: string): Step[] => {
    return text
      .split('\n')
      .filter((line) => line.trim())
      .map((line, index) => ({
        order: index + 1,
        instruction: line.trim(),
      }));
  };

  const onSubmit = async (data: CreateRecipeFormData) => {
    try {
      await updateRecipe.mutateAsync({
        id,
        input: {
          title: data.title,
          ingredients: ingredientsFromStructured(),
          steps: parseSteps(data.stepsText || ''),
          cookingTime: data.cookingTime ?? null,
          servings: data.servings ?? null,
          notes: data.notes || null,
          photoUri: photoRemoved ? null : photoUri,
          author: data.author ?? null,
          priceMin: data.priceMin ?? null,
          priceMax: data.priceMax ?? null,
          kcal: data.kcal ?? null,
          catalogue: data.catalogue ?? null,
          regime: data.regime ?? null,
          nutritionProteins: data.nutritionProteins ?? null,
          nutritionCarbs: data.nutritionCarbs ?? null,
          nutritionFats: data.nutritionFats ?? null,
        },
      });

      showToast('Recette mise à jour', 'success');
      router.back();
    } catch {
      showToast('Erreur de sauvegarde, veuillez réessayer', 'error');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Abandonner les modifications ?',
        'Vous avez des modifications non enregistrées. Voulez-vous vraiment les abandonner ?',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Abandonner', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la recette ?',
      'Cette action est irréversible. Voulez-vous vraiment supprimer cette recette ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync(id);
              showToast('Recette supprimée', 'success');
              router.replace('/(tabs)');
            } catch {
              showToast('Erreur de suppression, veuillez réessayer', 'error');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <LoadingScreen />
      </>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={handleCancel} hitSlop={8} style={styles.headerButtonContainer}>
              <Text style={styles.headerButton}>Annuler</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={updateRecipe.isPending}
              hitSlop={8}
              style={styles.headerButtonContainer}
            >
              {updateRecipe.isPending ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={styles.headerButton}>Valider</Text>
              )}
            </Pressable>
          ),
        }}
      />
      <RecipeForm
        control={control}
        errors={errors}
        photoUri={photoUri}
        onPhotoChange={handlePhotoChange}
        onDelete={handleDelete}
        onIngredientsChange={setStructuredIngredients}
      />
    </>
  );
}

// Helper functions to convert arrays to text for form
function ingredientsToText(ingredients: Ingredient[]): string {
  return ingredients
    .map((i) => {
      const parts = [];
      if (i.quantity) parts.push(i.quantity);
      if (i.unit) parts.push(i.unit);
      parts.push(i.name);
      return parts.join(' ');
    })
    .join('\n');
}

function stepsToText(steps: Step[]): string {
  return steps.map((s) => s.instruction).join('\n');
}

const styles = StyleSheet.create({
  headerButtonContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: 10,
    paddingBottom: spacing.xs,
  },
  headerButton: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.text,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
});
