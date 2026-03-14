import { View, Text, ScrollView, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipes } from '../../src/hooks';
import { Icon, MmmhLogo } from '../../src/components/ui';
import { CollectionSection } from '../../src/components/collections';

import { RecipeGridSkeleton } from '../../src/components/recipes/RecipeGridSkeleton';
import { colors, typography, fonts, spacing, radius } from '../../src/theme';
import type { Recipe } from '../../src/types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Logo area ~70, tab bar ~85, 3 section titles (24+margins) ~100, padding ~30
const FIXED_OVERHEAD = 285;

function NewRecipeCard({ recipe, cardHeight }: { recipe: Recipe; cardHeight: number }) {
  return (
    <Pressable
      style={({ pressed }) => [
        { height: cardHeight, aspectRatio: 1 },
        styles.newRecipeCard,
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      accessibilityLabel={recipe.title}
    >
      <View style={styles.newRecipeImageContainer}>
        {recipe.photoUri ? (
          <Image
            source={{ uri: recipe.photoUri }}
            style={styles.newRecipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.newRecipeImage, styles.newRecipePlaceholder]}>
            <Icon name="camera" size="lg" color={colors.textLight} />
          </View>
        )}
        <View style={styles.newRecipeOverlay}>
          <Text style={styles.newRecipeTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: recipes, isLoading, error } = useRecipes();

  const latestRecipes = useMemo(() => {
    if (!recipes || recipes.length === 0) return [];
    return recipes.slice(0, 2);
  }, [recipes]);

  const collections = useMemo(() => {
    if (!recipes || recipes.length === 0) return { recipeBooks: [], menus: [] };

    const recipeImages = recipes.filter((r) => r.photoUri).map((r) => r.photoUri as string);

    const recipeBooks = [
      {
        id: 'all',
        name: 'Toutes les recettes',
        images: recipeImages.slice(0, 4),
      },
      {
        id: 'favorites',
        name: 'Favoris',
        images: recipeImages.slice(0, 4),
      },
    ];

    const menus = [
      {
        id: 'menu-1',
        name: 'Menu semaine',
        images: recipeImages.slice(0, 4),
      },
    ];

    return { recipeBooks, menus };
  }, [recipes]);

  const handleCollectionPress = (id: string) => {
    if (id === 'all') {
      router.push('/(tabs)/search');
    }
  };

  const handleNewCollection = () => {
    // TODO: Open create collection modal
  };

  // Compute card heights based on available screen space
  const availableHeight = SCREEN_HEIGHT - FIXED_OVERHEAD - insets.top - insets.bottom;
  const recipeCardHeight = availableHeight * 0.45;
  const collectionCardHeight = availableHeight * 0.33;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.logoContainer}>
          <MmmhLogo width={140} />
        </View>
        <RecipeGridSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="calories" size="lg" color={colors.error} />
        <Text style={styles.errorText}>Erreur de chargement</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.logoContainer}>
        <MmmhLogo width={140} />
      </View>

      <View style={styles.sectionsContainer}>
        {/* Nouvelle recette section */}
        {latestRecipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nouvelle recette</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newRecipeRow}
            >
              {latestRecipes.map((recipe) => (
                <NewRecipeCard key={recipe.id} recipe={recipe} cardHeight={recipeCardHeight} />
              ))}
            </ScrollView>
          </View>
        )}

        <CollectionSection
          title="Livre de recette"
          collections={collections.recipeBooks}
          onCollectionPress={handleCollectionPress}
          onNewPress={handleNewCollection}
          showNewButton
          cardHeight={collectionCardHeight}
        />

        <CollectionSection
          title="Regime & Menu"
          collections={collections.menus}
          onCollectionPress={handleCollectionPress}
          onNewPress={handleNewCollection}
          showNewButton
          cardHeight={collectionCardHeight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sectionsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Shanti',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  newRecipeRow: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  newRecipeCard: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  newRecipeImageContainer: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000',
  },
  newRecipeImage: {
    width: '100%',
    flex: 1,
    backgroundColor: colors.surfaceAlt,
  },
  newRecipePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  newRecipeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  newRecipeTitle: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.titleScript,
    color: colors.error,
    marginTop: spacing.md,
  },
  errorSubtext: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
