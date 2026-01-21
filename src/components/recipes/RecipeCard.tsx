import { View, Text, Image, Pressable, StyleSheet, ImageSourcePropType } from 'react-native';
import type { Recipe } from '../../types';
import { colors, typography, spacing, radius } from '../../theme';
import { Badge } from '../ui';

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
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
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
          <Badge icon="time" value={`${recipe.cookingTime} min`} style={styles.badge} />
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
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
