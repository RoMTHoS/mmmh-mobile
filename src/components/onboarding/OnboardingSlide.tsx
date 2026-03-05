import { View, Text, Image, StyleSheet, ImageSourcePropType, Dimensions } from 'react-native';
import { colors, typography, spacing } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlideProps {
  illustration: ImageSourcePropType;
  title: string;
  description: string;
}

export function OnboardingSlide({ illustration, title, description }: OnboardingSlideProps) {
  return (
    <View style={styles.container} testID="onboarding-slide">
      <View style={styles.illustrationContainer}>
        <Image source={illustration} style={styles.illustration} resizeMode="contain" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: Dimensions.get('window').width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustration: {
    width: '70%',
    height: SCREEN_HEIGHT * 0.35,
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
