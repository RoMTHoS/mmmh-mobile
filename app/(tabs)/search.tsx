import { View, Text, FlatList, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipes } from '../../src/hooks';
import { LoadingScreen, SearchBar, Icon } from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/theme';
import type { Recipe } from '../../src/types';

const NUM_COLUMNS = 3;
const GRID_GAP = spacing.sm;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface RecipeGridItemProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

function RecipeGridItem({ recipe, onPress }: RecipeGridItemProps) {
  // Vary height for masonry effect
  const aspectRatio = recipe.id.charCodeAt(0) % 2 === 0 ? 1 : 1.3;

  return (
    <Pressable
      style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}
      onPress={() => onPress(recipe)}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      {recipe.photoUri ? (
        <Image
          source={{ uri: recipe.photoUri }}
          style={[styles.gridImage, { aspectRatio }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.gridImage, styles.gridImagePlaceholder, { aspectRatio }]}>
          <Icon name="camera" size="lg" color={colors.textLight} />
        </View>
      )}
      <Text style={styles.gridItemTitle} numberOfLines={1}>
        {recipe.title}
      </Text>
    </Pressable>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: recipes, isLoading, error, refetch, isRefetching } = useRecipes();

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    if (!searchQuery.trim()) return recipes;

    const query = searchQuery.toLowerCase();
    return recipes.filter((r) => {
      const titleMatch = r.title.toLowerCase().includes(query);
      const ingredientMatch = r.ingredients?.some((ing) => ing.name.toLowerCase().includes(query));
      return titleMatch || ingredientMatch;
    });
  }, [recipes, searchQuery]);

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="calories" size="lg" color={colors.error} />
        <Text style={styles.errorText}>Erreur de chargement</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.pageTitle}>Toutes les recettes</Text>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher"
        style={styles.searchBar}
      />

      {filteredRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="search" size="lg" color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'Aucune recette trouvée' : 'Aucune recette'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? "Essayez avec d'autres mots-clés"
              : 'Importez ou créez votre première recette'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <RecipeGridItem recipe={item} onPress={handleRecipePress} />}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageTitle: {
    ...typography.headerScript,
    color: colors.text,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchBar: {
    margin: spacing.md,
  },
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
  },
  gridItemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  gridImage: {
    width: '100%',
    borderRadius: radius.md,
  },
  gridImagePlaceholder: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xs,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.titleScript,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
});
