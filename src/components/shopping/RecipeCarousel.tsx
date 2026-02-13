import { useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import type { ShoppingListRecipe } from '../../types';

interface RecipeCarouselProps {
  recipes: ShoppingListRecipe[];
  highlightRecipeId?: string;
  onRemoveRecipe?: (recipe: ShoppingListRecipe) => void;
}

const CARD_SIZE = 72;

function RecipeCard({
  recipe,
  isHighlighted,
  onLongPress,
}: {
  recipe: ShoppingListRecipe;
  isHighlighted: boolean;
  onLongPress?: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isHighlighted) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isHighlighted, scaleAnim]);

  return (
    <Pressable onLongPress={onLongPress} testID={`carousel-card-${recipe.recipeId}`}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {recipe.recipePhotoUri ? (
          <Image
            source={{ uri: recipe.recipePhotoUri }}
            style={[styles.thumbnail, isHighlighted && styles.thumbnailHighlighted]}
          />
        ) : (
          <View
            style={[
              styles.thumbnail,
              styles.placeholderThumbnail,
              isHighlighted && styles.thumbnailHighlighted,
            ]}
          >
            <Text style={styles.placeholderText}>
              {recipe.recipeTitle?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <Text style={styles.cardTitle} numberOfLines={1}>
          {recipe.recipeTitle ?? 'Sans titre'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function RecipeCarousel({
  recipes,
  highlightRecipeId,
  onRemoveRecipe,
}: RecipeCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [highlightId, setHighlightId] = useState(highlightRecipeId);

  // Auto-scroll to highlighted recipe and clear highlight after animation
  useEffect(() => {
    if (!highlightRecipeId) return;
    setHighlightId(highlightRecipeId);

    const idx = recipes.findIndex((r) => r.recipeId === highlightRecipeId);
    if (idx >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      }, 100);
    }

    const timer = setTimeout(() => setHighlightId(undefined), 1500);
    return () => clearTimeout(timer);
  }, [highlightRecipeId, recipes]);

  return (
    <View style={styles.container} testID="recipe-carousel">
      <Text style={styles.sectionTitle}>Recettes dans la liste</Text>
      <FlatList
        ref={flatListRef}
        data={recipes}
        keyExtractor={(item) => item.recipeId}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            isHighlighted={item.recipeId === highlightId}
            onLongPress={onRemoveRecipe ? () => onRemoveRecipe(item) : undefined}
          />
        )}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={() => {}}
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
  thumbnailHighlighted: {
    borderWidth: 2,
    borderColor: colors.accent,
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
