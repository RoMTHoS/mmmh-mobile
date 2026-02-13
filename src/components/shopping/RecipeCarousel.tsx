import { FlatList, View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import type { ShoppingListRecipe } from '../../types';

interface RecipeCarouselProps {
  recipes: ShoppingListRecipe[];
}

const CARD_SIZE = 72;

function RecipeCard({ recipe }: { recipe: ShoppingListRecipe }) {
  return (
    <View style={styles.card} testID={`carousel-card-${recipe.recipeId}`}>
      {recipe.recipePhotoUri ? (
        <Image source={{ uri: recipe.recipePhotoUri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
          <Text style={styles.placeholderText}>
            {recipe.recipeTitle?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {recipe.recipeTitle ?? 'Sans titre'}
      </Text>
    </View>
  );
}

export function RecipeCarousel({ recipes }: RecipeCarouselProps) {
  return (
    <View style={styles.container} testID="recipe-carousel">
      <Text style={styles.sectionTitle}>Recettes dans la liste</Text>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.recipeId}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    alignItems: 'center',
    width: CARD_SIZE,
  },
  thumbnail: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderText: {
    ...typography.h2,
    color: colors.textMuted,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
    width: CARD_SIZE,
  },
});
