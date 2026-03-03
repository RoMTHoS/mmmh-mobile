import { useState } from 'react';
import { StyleSheet, Alert, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActivityIndicator } from 'react-native';
import { useToastStore } from '../../src/stores/toastStore';

import { useCreateRecipe } from '../../src/hooks';
import { Text } from '../../src/components/ui';
import { RecipeForm } from '../../src/components/recipes';
import { createRecipeSchema, type CreateRecipeFormData } from '../../src/schemas/recipe.schema';
import type { Ingredient, Step } from '../../src/types';
import { colors, spacing, fonts } from '../../src/theme';

export default function CreateRecipeScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const createRecipe = useCreateRecipe();
  const showToast = useToastStore((s) => s.showToast);

  const {
    control,
    handleSubmit,
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
      const recipe = await createRecipe.mutateAsync({
        title: data.title,
        ingredients: parseIngredients(data.ingredientsText || ''),
        steps: parseSteps(data.stepsText || ''),
        cookingTime: data.cookingTime ?? null,
        servings: data.servings ?? null,
        notes: data.notes || null,
        photoUri,
        author: data.author ?? null,
        priceMin: data.priceMin ?? null,
        priceMax: data.priceMax ?? null,
        kcal: data.kcal ?? null,
        catalogue: data.catalogue ?? null,
        regime: data.regime ?? null,
        nutritionProteins: data.nutritionProteins ?? null,
        nutritionCarbs: data.nutritionCarbs ?? null,
        nutritionFats: data.nutritionFats ?? null,
      });

      showToast('Recette enregistrée', 'success');
      router.replace(`/recipe/${recipe.id}`);
    } catch {
      showToast('Erreur de sauvegarde, veuillez réessayer', 'error');
    }
  };

  const handleCancel = () => {
    if (isDirty || photoUri) {
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
              disabled={createRecipe.isPending}
              hitSlop={8}
              style={styles.headerButtonContainer}
            >
              {createRecipe.isPending ? (
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
        onPhotoChange={setPhotoUri}
        autoFocusTitle
      />
    </>
  );
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
