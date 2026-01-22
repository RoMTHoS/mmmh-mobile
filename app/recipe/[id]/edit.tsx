import { useState, useEffect } from 'react';
import { StyleSheet, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { useRecipe, useUpdateRecipe, useDeleteRecipe } from '../../../src/hooks';
import { LoadingScreen, Text } from '../../../src/components/ui';
import { RecipeForm } from '../../../src/components/recipes';
import { createRecipeSchema, type CreateRecipeFormData } from '../../../src/schemas/recipe.schema';
import type { Ingredient, Step } from '../../../src/types';
import { colors, spacing, fonts } from '../../../src/theme';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading } = useRecipe(id);
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [originalPhotoUri, setOriginalPhotoUri] = useState<string | null>(null);

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

  const parseIngredients = (text: string): Ingredient[] => {
    return text
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({
        name: line.trim(),
        quantity: null,
        unit: null,
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
          ingredients: parseIngredients(data.ingredientsText || ''),
          steps: parseSteps(data.stepsText || ''),
          cookingTime: data.cookingTime ?? null,
          servings: data.servings ?? null,
          notes: data.notes || null,
          photoUri: photoRemoved ? null : photoUri,
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Recette mise à jour',
        text2: 'Vos modifications ont été enregistrées',
        visibilityTime: 2000,
      });

      router.back();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erreur de sauvegarde',
        text2: 'Veuillez réessayer',
      });
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
              Toast.show({
                type: 'success',
                text1: 'Recette supprimée',
                visibilityTime: 2000,
              });
              router.replace('/(tabs)');
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Erreur de suppression',
                text2: 'Veuillez réessayer',
              });
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
              <Text
                style={[styles.headerButton, updateRecipe.isPending && styles.headerButtonDisabled]}
              >
                Valider
              </Text>
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
