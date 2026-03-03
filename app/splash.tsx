import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts } from '../src/theme';
import { MmmhLogo } from '../src/components/ui';

const SPLASH_SEEN_KEY = 'SPLASH_SEEN';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ROWS = 8;

export default function SplashScreen() {
  const [, setPhase] = useState<1 | 2>(1);
  const phase1Opacity = useRef(new Animated.Value(1)).current;
  const phase2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1 shows for 1.2s, then crossfade to phase 2
    const timer1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(phase1Opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(phase2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => setPhase(2));
    }, 1200);

    // Navigate to home after 2.5s total
    const timer2 = setTimeout(async () => {
      await AsyncStorage.setItem(SPLASH_SEEN_KEY, 'true');
      router.replace('/(tabs)');
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [phase1Opacity, phase2Opacity]);

  return (
    <View style={styles.container}>
      {/* Phase 1: Repeated MMMH logos filling the screen */}
      <Animated.View style={[styles.phase, { opacity: phase1Opacity }]}>
        {Array.from({ length: ROWS }).map((_, i) => (
          <View key={i} style={styles.repeatedRow}>
            <MmmhLogo width={SCREEN_WIDTH * 0.7} />
          </View>
        ))}
      </Animated.View>

      {/* Phase 2: Bienvenue sur MMMH / Bon appétit! */}
      <Animated.View style={[styles.phase, styles.phase2, { opacity: phase2Opacity }]}>
        <Text style={styles.welcomeText}>Bienvenue sur</Text>
        <MmmhLogo width={260} />
        <Text style={styles.appetitText}>Bon appétit !</Text>
      </Animated.View>
    </View>
  );
}

export async function shouldShowSplash(): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(SPLASH_SEEN_KEY);
    return seen !== 'true';
  } catch {
    return true;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  phase: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  phase2: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  repeatedRow: {
    marginVertical: 4,
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: fonts.script,
    fontSize: 22,
    color: colors.text,
  },
  appetitText: {
    fontFamily: fonts.script,
    fontSize: 22,
    color: colors.text,
  },
});
