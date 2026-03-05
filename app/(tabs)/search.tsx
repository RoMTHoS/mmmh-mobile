import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipes } from '../../src/hooks';
import { SearchBar, Icon, EmptyState } from '../../src/components/ui';
import { RecipeGridSkeleton } from '../../src/components/recipes/RecipeGridSkeleton';
import { useUIStore } from '../../src/stores/uiStore';
import { colors, spacing, radius, fonts } from '../../src/theme';
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
  return (
    <Pressable
      style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}
      onPress={() => onPress(recipe)}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      {recipe.photoUri ? (
        <Image source={{ uri: recipe.photoUri }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
          <Icon name="camera" size="lg" color={colors.textLight} />
        </View>
      )}
    </Pressable>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const openImportModal = useUIStore((s) => s.openImportModal);
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
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SearchBar
          value=""
          onChangeText={() => {}}
          placeholder="Rechercher"
          style={styles.searchBar}
        />
        <RecipeGridSkeleton />
      </View>
    );
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
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher"
        style={styles.searchBar}
      />

      {filteredRecipes.length === 0 ? (
        <EmptyState
          icon="search"
          title={searchQuery ? 'Aucune recette trouvée' : 'Aucune recette'}
          description={
            searchQuery
              ? "Essayez avec d'autres mots-clés"
              : 'Importez ou créez votre première recette'
          }
          actionLabel={searchQuery ? undefined : 'Importer une recette'}
          onAction={searchQuery ? undefined : openImportModal}
        />
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <RecipeGridItem recipe={item} onPress={handleRecipePress} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
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
    aspectRatio: 1,
    borderRadius: radius.md,
  },
  gridImagePlaceholder: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    fontFamily: fonts.script,
    fontSize: 20,
    color: colors.error,
    marginTop: spacing.md,
  },
});
