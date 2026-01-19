import { View, Text, Image, Pressable, StyleSheet, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER_IMAGE: ImageSourcePropType = require('../../../assets/placeholder-food.png');

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      testID="recipe-card"
    >
      <Image
        source={recipe.photoUri ? { uri: recipe.photoUri } : PLACEHOLDER_IMAGE}
        style={styles.image}
        resizeMode="cover"
        testID="recipe-image"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        {recipe.cookingTime && (
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={12} color={colors.accent} />
            <Text style={styles.badgeText}>{recipe.cookingTime} min</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.border,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '500',
  },
});
