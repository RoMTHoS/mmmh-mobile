import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  ViewToken,
} from 'react-native';
import { OnboardingSlide } from './OnboardingSlide';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { analytics } from '../../services/analytics';
import { EVENTS } from '../../utils/analyticsEvents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  key: string;
  title: string;
  description: string;
  illustration: ReturnType<typeof require>;
}

const SLIDES: SlideData[] = [
  {
    key: 'transform',
    title: 'Transforme tes recettes',
    description:
      'Convertis les vidéos et posts de recettes des réseaux sociaux en fiches pratiques organisées.',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    illustration: require('../../../assets/onboarding/slide-1.png'),
  },
  {
    key: 'import',
    title: 'Colle, scanne, importe',
    description:
      'Colle un lien vidéo, un site web ou prends une photo. Notre IA extrait la recette pour toi.',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    illustration: require('../../../assets/onboarding/slide-2.png'),
  },
  {
    key: 'collection',
    title: 'Construis ta collection',
    description:
      'Organise tes recettes en collections, crée tes listes de courses et cuisine en toute simplicité.',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    illustration: require('../../../assets/onboarding/slide-3.png'),
  },
  {
    key: 'premium',
    title: 'Essaie Premium gratuitement',
    description:
      "Profite de 7 jours d'essai gratuit avec imports illimités et extraction IA premium.",
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    illustration: require('../../../assets/onboarding/slide-4.png'),
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
  onSkip: (slideIndex: number) => void;
}

export function OnboardingCarousel({ onComplete, onSkip }: OnboardingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);
  const slideTimestampRef = useRef<number>(Date.now());

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const trackSlideTime = useCallback((fromIndex: number) => {
    const now = Date.now();
    const duration = now - slideTimestampRef.current;
    analytics.track(EVENTS.ONBOARDING_SLIDE_VIEWED, {
      slideIndex: fromIndex,
      slideTitle: SLIDES[fromIndex].key,
      durationMs: duration,
    });
    slideTimestampRef.current = now;
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const newIndex = viewableItems[0].index;
        if (newIndex !== currentIndex) {
          trackSlideTime(currentIndex);
        }
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex, trackSlideTime]
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (isLastSlide) {
      trackSlideTime(currentIndex);
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleSkip = () => {
    trackSlideTime(currentIndex);
    onSkip(currentIndex);
  };

  // Preload images on mount
  SLIDES.forEach((slide) => {
    const resolved = Image.resolveAssetSource(slide.illustration);
    if (resolved?.uri) {
      Image.prefetch(resolved.uri).catch(() => {
        // Silently ignore — local assets load fine without prefetch
      });
    }
  });

  const renderItem = useCallback(
    ({ item }: { item: SlideData }) => (
      <OnboardingSlide
        illustration={item.illustration}
        title={item.title}
        description={item.description}
      />
    ),
    []
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  return (
    <View style={styles.container} testID="onboarding-carousel">
      {/* Skip button */}
      <Pressable style={styles.skipButton} onPress={handleSkip} testID="onboarding-skip">
        <Text style={styles.skipText}>Passer</Text>
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
      />

      {/* Bottom: dots + button */}
      <View style={styles.bottomContainer}>
        {/* Dot indicators */}
        <View style={styles.dotsContainer} testID="onboarding-dots">
          {SLIDES.map((slide, index) => (
            <View
              key={slide.key}
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <Pressable
          style={styles.nextButton}
          onPress={handleNext}
          testID={isLastSlide ? 'onboarding-get-started' : 'onboarding-next'}
        >
          <Text style={styles.nextButtonText}>{isLastSlide ? 'Commencer' : 'Suivant'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
  },
  bottomContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textLight,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    ...typography.button,
    color: colors.background,
  },
});
