import { View, Text, Image, StyleSheet, ImageSourcePropType, Dimensions } from 'react-native';
import { colors, typography, spacing, fonts } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration?: ImageSourcePropType;
  video?: ImageSourcePropType;
}

export function OnboardingSlide({ title, description, illustration, video }: OnboardingSlideProps) {
  const isTutorial = !!video;

  if (isTutorial) {
    return (
      <View style={styles.container} testID="onboarding-slide">
        <View style={styles.tutorialTextContainer}>
          <Text style={styles.tutorialTitle}>{title}</Text>
          <Text style={styles.tutorialDescription}>{description}</Text>
        </View>
        <View style={styles.videoContainer}>
          <Image source={video} style={styles.videoImage} resizeMode="contain" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="onboarding-slide">
      <View style={styles.illustrationContainer}>
        {illustration && (
          <Image source={illustration} style={styles.illustration} resizeMode="contain" />
        )}
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
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tutorial layout: text top, video below
  tutorialTextContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  tutorialTitle: {
    fontFamily: fonts.script,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tutorialDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  videoContainer: {
    flex: 1,
    aspectRatio: 350 / 758,
    marginBottom: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  // Classic layout: illustration top, text below
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
