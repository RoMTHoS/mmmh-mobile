import { useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  Animated,
} from 'react-native';
import type { Recipe } from '../../types';
import { colors, fonts, spacing, radius } from '../../theme';
import { Badge } from '../ui';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER_IMAGE: ImageSourcePropType = require('../../../assets/placeholder-food.png');

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
}

const SPRING_CONFIG = { damping: 15, stiffness: 150, mass: 1, useNativeDriver: true };

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const handlePressIn = () => {
    if (!reducedMotion) {
      Animated.spring(scale, { ...SPRING_CONFIG, toValue: 0.97 }).start();
    }
  };

  const handlePressOut = () => {
    if (!reducedMotion) {
      Animated.spring(scale, { ...SPRING_CONFIG, toValue: 1 }).start();
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID="recipe-card"
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Image
          source={recipe.photoUri ? { uri: recipe.photoUri } : PLACEHOLDER_IMAGE}
          style={styles.image}
          resizeMode="cover"
          testID="recipe-image"
        />
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          {recipe.cookingTime && (
            <Badge icon="time" value={`${recipe.cookingTime} min`} style={styles.badge} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
