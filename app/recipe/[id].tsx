import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ImageSourcePropType,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRecipe, useActiveShoppingList, useShoppingListRecipes } from '../../src/hooks';
import { useShoppingStore } from '../../src/stores/shoppingStore';
import { analytics } from '../../src/services/analytics';
import { EVENTS } from '../../src/utils/analyticsEvents';
import { LoadingScreen, Badge, Icon } from '../../src/components/ui';
import { IngredientList, StepList } from '../../src/components/recipes';
import { ServingsSelector } from '../../src/components/shopping';
import { colors, typography, spacing, fonts } from '../../src/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER_IMAGE: ImageSourcePropType = require('../../assets/placeholder-food.png');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const [servingsSelectorVisible, setServingsSelectorVisible] = useState(false);
  const [displayServings, setDisplayServings] = useState<number | null>(null);

  const activeListId = useShoppingStore((s) => s.activeListId);
  const listQuery = useActiveShoppingList();
  const defaultListId = listQuery.data?.id ?? '';
  const listId = activeListId ?? defaultListId;
  const recipesQuery = useShoppingListRecipes(listId);

  const existingEntry = useMemo(
    () => recipesQuery.data?.find((r) => r.recipeId === id) ?? null,
    [recipesQuery.data, id]
  );
  const isInList = existingEntry !== null;

  // Keep screen awake while viewing recipe (for cooking)
  useEffect(() => {
    activateKeepAwakeAsync().catch(() => {});
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  useEffect(() => {
    if (id) analytics.track(EVENTS.RECIPE_VIEWED, { recipe_id: id });
  }, [id]);

  useEffect(() => {
    if (recipe?.servings) setDisplayServings(recipe.servings);
  }, [recipe?.servings]);

  useEffect(() => {
    if (id) analytics.track(EVENTS.RECIPE_VIEWED, { recipe_id: id });
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <LoadingScreen />
      </>
    );
  }

  if (error || !recipe) {
    return (
      <>
        <Stack.Screen options={{ title: 'Recette introuvable' }} />
        <View style={styles.errorContainer}>
          <Icon name="calories" size="lg" color={colors.error} />
          <Text style={styles.errorTitle}>Recette introuvable</Text>
          <Text style={styles.errorSubtitle}>Cette recette a peut-être été supprimée.</Text>
        </View>
      </>
    );
  }

  const servings = displayServings ?? recipe.servings ?? 4;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShadowVisible: false,
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.headerButton}
              accessibilityLabel="Retour"
            >
              <Icon name="arrow-left" size="lg" color={colors.text} />
            </Pressable>
          ),
          headerTitle: () => null,
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/recipe/${id}/edit`)}
              hitSlop={8}
              style={styles.headerButton}
              accessibilityLabel="Modifier la recette"
            >
              <Icon name="pencil" size="lg" color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.recipeTitle}>{recipe.title}</Text>

        {/* Hero Image */}
        <Image
          source={recipe.photoUri ? { uri: recipe.photoUri } : PLACEHOLDER_IMAGE}
          style={styles.heroImage}
          resizeMode="cover"
          testID="recipe-hero-image"
        />

        <View style={styles.content}>
          {/* Author Row */}
          {recipe.author && (
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <Icon name="servings" size="sm" color={colors.textMuted} />
              </View>
              <Text style={styles.authorText}>Par {recipe.author}</Text>
            </View>
          )}

          {/* Metadata Badges */}
          <View style={styles.metadata}>
            {recipe.cookingTime && <Badge icon="time" value={`${recipe.cookingTime} mn`} />}
            {(recipe.priceMin || recipe.priceMax) && (
              <Badge
                icon="cost"
                value={
                  recipe.priceMin && recipe.priceMax
                    ? `${recipe.priceMin}-${recipe.priceMax} €`
                    : `${recipe.priceMin ?? recipe.priceMax} €`
                }
              />
            )}
            {recipe.kcal && <Badge icon="calories" value={`${recipe.kcal} kcal`} />}
            {!recipe.priceMin && !recipe.priceMax && !recipe.kcal && recipe.servings && (
              <Badge icon="servings" value={`${recipe.servings} portions`} />
            )}
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.sectionTitle}>Ingrédients</Text>
              <View style={styles.servingsStepper}>
                <Icon name="servings" size="md" color={colors.text} />
                <Pressable
                  onPress={() => setDisplayServings(Math.max(1, servings - 1))}
                  style={styles.stepperButton}
                  accessibilityLabel="Diminuer les portions"
                >
                  <Text style={styles.stepperButtonText}>-</Text>
                </Pressable>
                <Text style={styles.servingsCount}>{servings}</Text>
                <Pressable
                  onPress={() => setDisplayServings(servings + 1)}
                  style={styles.stepperButton}
                  accessibilityLabel="Augmenter les portions"
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
            <IngredientList ingredients={recipe.ingredients} />
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <StepList steps={recipe.steps} />
          </View>

          {/* Notes Section */}
          {recipe.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes}>{recipe.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {recipe && (
        <ServingsSelector
          visible={servingsSelectorVisible}
          onClose={() => setServingsSelectorVisible(false)}
          recipe={recipe}
          listId={listId}
          existingEntry={existingEntry}
        />
      )}

      {/* Bottom Action Bar — Courses + Partager only */}
      <View style={styles.actionBar}>
        <Pressable
          style={styles.actionButton}
          onPress={() => setServingsSelectorVisible(true)}
          accessibilityLabel="Ajouter aux courses"
          testID="courses-button"
        >
          <Icon
            name={isInList ? 'cart' : 'cart-outline'}
            size="lg"
            color={isInList ? colors.accent : colors.text}
          />
          <Text style={[styles.actionText, isInList && styles.actionTextActive]}>
            Ajouter à une liste de course
          </Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeTitle: {
    fontFamily: fonts.script,
    fontSize: 24,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleScript,
    color: colors.text,
  },
  servingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepperButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    lineHeight: 18,
  },
  servingsCount: {
    fontFamily: fonts.sans,
    fontSize: 20,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  notes: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 80,
    paddingVertical: spacing.sm,
  },
  actionText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
  },
  actionTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    ...typography.titleScript,
    color: colors.text,
    marginTop: spacing.md,
  },
  errorSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
