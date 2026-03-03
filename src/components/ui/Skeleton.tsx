import { useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { colors, radius } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, borderRadius = radius.md, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.5);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      style={[styles.skeleton, { width, height, borderRadius, opacity }, style]}
      accessibilityLabel="Chargement"
      accessibilityRole="progressbar"
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surface,
  },
});
