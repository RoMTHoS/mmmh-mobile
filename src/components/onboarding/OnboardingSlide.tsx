import { View, Text, Image, StyleSheet, ImageSourcePropType, Dimensions } from 'react-native';
import { colors, typography, spacing, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

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
          {/* Placeholder — replace with screen recording image/gif */}
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle-outline" size={48} color={colors.textMuted} />
            <Text style={styles.videoPlaceholderText}>Screen recording</Text>
          </View>
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
    width: SCREEN_WIDTH * 0.75,
    marginBottom: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  videoPlaceholderText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
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
