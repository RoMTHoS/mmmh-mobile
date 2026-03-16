import { useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onRemove,
}: {
  recipe: ShoppingListRecipe;
  isHighlighted: boolean;
  onLongPress?: () => void;
  onRemove?: () => void;
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
        <View>
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
          {onRemove && (
            <Pressable
              style={styles.removeButton}
              onPress={onRemove}
              hitSlop={6}
              testID={`carousel-remove-${recipe.recipeId}`}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {recipe.recipeTitle ?? 'Sans titre'}
        </Text>
        <View style={styles.portionBadge}>
          <Ionicons name="person-outline" size={12} color={colors.text} />
          <Text style={styles.portionText}>{Math.round(recipe.servingsMultiplier)}</Text>
        </View>
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
            onRemove={onRemoveRecipe ? () => onRemoveRecipe(item) : undefined}
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
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 2,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
    width: CARD_SIZE,
  },
  portionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  portionText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 11,
  },
});
