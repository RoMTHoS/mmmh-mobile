import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes } from '../../src/hooks';
import { LoadingScreen } from '../../src/components/ui';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import type { Recipe } from '../../src/types';

const NUM_COLUMNS = 3;
const GRID_GAP = spacing.sm;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

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
    >
      {recipe.photoUri ? (
        <Image
          source={{ uri: recipe.photoUri }}
          style={[styles.gridImage, { aspectRatio }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.gridImage, styles.gridImagePlaceholder, { aspectRatio }]}>
          <Ionicons name="image-outline" size={24} color={colors.textLight} />
        </View>
      )}
    </Pressable>
  );
}

export default function SearchScreen() {
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
    router.push({
      pathname: '/(modals)/quick-preview',
      params: {
        id: recipe.id,
        title: recipe.title,
        imageUri: recipe.photoUri || '',
        prepTime: recipe.cookingTime?.toString() || '',
        difficulty: '',
      },
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Erreur de chargement</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {filteredRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={colors.textMuted} />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.base,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  gridContent: {
    padding: spacing.base,
    paddingTop: 0,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  gridItemPressed: {
    opacity: 0.8,
  },
  gridImage: {
    width: '100%',
    borderRadius: borderRadius.md,
  },
  gridImagePlaceholder: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.base,
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
    padding: spacing['2xl'],
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
    marginTop: spacing.base,
  },
});
