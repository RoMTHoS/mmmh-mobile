import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { useImportStore } from '../../src/stores/importStore';
import { useCreateRecipe } from '../../src/hooks';
import { reviewRecipeSchema, type ReviewRecipeFormData } from '../../src/schemas/review.schema';
import { ReviewRecipeForm, ConfidenceIndicator } from '../../src/components/review';
import { Text, Button } from '../../src/components/ui';
import { colors, spacing, fonts } from '../../src/theme';
import type { Ingredient, Step } from '../../src/types';

interface ExtractedRecipe {
  title?: string;
  description?: string;
  ingredients?: Array<{
    name: string;
    quantity?: number | string;
    unit?: string;
    notes?: string;
  }>;
  instructions?: Array<{
    text?: string;
    stepNumber?: number;
    duration?: number;
  }>;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  thumbnailUrl?: string;
  aiConfidence?: number;
  rawTranscript?: string;
}

export default function RecipeReviewScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { removeJob, getJob } = useImportStore();
  const createRecipe = useCreateRecipe();

  const job = getJob(jobId || '');
  const recipe = job?.result as ExtractedRecipe | undefined;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hasAiPhoto, setHasAiPhoto] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const methods = useForm<ReviewRecipeFormData>({
    resolver: zodResolver(reviewRecipeSchema),
    defaultValues: {
      title: '',
      description: '',
      ingredientsText: '',
      stepsText: '',
      prepTime: null,
      cookTime: null,
      servings: null,
      photoUri: null,
    },
  });

  const {
    formState: { isDirty },
  } = methods;

  // Reset form when recipe data becomes available (after store hydration)
  useEffect(() => {
    if (recipe && !isHydrated) {
      methods.reset(mapRecipeToForm(recipe));
      setPhotoUri(recipe.thumbnailUrl || null);
      setHasAiPhoto(!!recipe.thumbnailUrl);
      setIsHydrated(true);
    }
  }, [recipe, isHydrated, methods]);

  if (!jobId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>ID de job manquant</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  if (!job || !recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Recette non trouvee. Elle a peut-etre expire.</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

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

  const handleSave = async (data: ReviewRecipeFormData) => {
    try {
      const newRecipe = await createRecipe.mutateAsync({
        title: data.title,
        ingredients: parseIngredients(data.ingredientsText),
        steps: parseSteps(data.stepsText),
        cookingTime: data.cookTime ?? data.prepTime ?? null,
        servings: data.servings ?? null,
        notes: data.description || null,
        photoUri,
      });

      // Remove job from store after successful save
      removeJob(jobId);

      Toast.show({
        type: 'success',
        text1: 'Recette enregistree!',
        text2: 'Votre recette a ete ajoutee au catalogue',
        visibilityTime: 2000,
      });

      // Navigate to the new recipe
      router.replace(`/recipe/${newRecipe.id}`);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erreur de sauvegarde',
        text2: 'Veuillez reessayer',
      });
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Supprimer la recette?',
      'Cette action supprimera la recette importee. Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            removeJob(jobId);
            Toast.show({
              type: 'info',
              text1: 'Recette supprimee',
            });
            router.back();
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        'Modifications non enregistrees',
        'Voulez-vous vraiment quitter? Les modifications seront perdues mais la recette restera accessible depuis limport.',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
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
              onPress={methods.handleSubmit(handleSave)}
              disabled={createRecipe.isPending}
              hitSlop={8}
              style={styles.headerButtonContainer}
            >
              <Text
                style={[styles.headerButton, createRecipe.isPending && styles.headerButtonDisabled]}
              >
                Enregistrer
              </Text>
            </Pressable>
          ),
        }}
      />
      <FormProvider {...methods}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.title}>Verifier la recette</Text>

          <ConfidenceIndicator confidence={recipe.aiConfidence ?? 0.5} />

          <ReviewRecipeForm
            photoUri={photoUri}
            onPhotoChange={setPhotoUri}
            hasAiPhoto={hasAiPhoto}
          />

          <View style={styles.discardSection}>
            <Button title="Supprimer l'import" onPress={handleDiscard} variant="destructive" />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </FormProvider>
    </>
  );
}

function mapRecipeToForm(recipe: ExtractedRecipe): ReviewRecipeFormData {
  return {
    title: recipe.title || '',
    description: recipe.description || '',
    ingredientsText:
      recipe.ingredients
        ?.map((i) => {
          const parts: string[] = [];
          if (i.quantity) parts.push(String(i.quantity));
          if (i.unit) parts.push(i.unit);
          parts.push(i.name);
          if (i.notes) parts.push(`(${i.notes})`);
          return parts.join(' ');
        })
        .join('\n') || '',
    stepsText: recipe.instructions?.map((s) => s.text || '').join('\n') || '',
    prepTime: recipe.prepTime ?? null,
    cookTime: recipe.cookTime ?? null,
    servings: recipe.servings ?? null,
    photoUri: recipe.thumbnailUrl ?? null,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.md,
  },
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
  discardSection: {
    marginTop: spacing.xl,
  },
  bottomPadding: {
    height: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
