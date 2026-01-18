import { View, Text, Image, Pressable, StyleSheet, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe } from '../../types';

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
            <Ionicons name="time-outline" size={12} color="#92400E" />
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
    margin: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
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
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
});
