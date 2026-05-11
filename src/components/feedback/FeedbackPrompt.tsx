/**
 * Non-intrusive prompt shown once after the user's first successful import.
 * Encourages beta testers to share feedback.
 *
 * Shows as a bottom banner that can be dismissed.
 * Only shown once — tracked via AsyncStorage flags.
 *
 * @see Story 6.2 Task 5
 */

import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, fonts, spacing, radius } from '../../theme';
import { analytics } from '../../services/analytics';
import { EVENTS } from '../../utils/analyticsEvents';

const FEEDBACK_PROMPT_SHOWN_KEY = 'MMMH_FEEDBACK_PROMPT_SHOWN';
const FEEDBACK_SUBMITTED_KEY = 'MMMH_FEEDBACK_SUBMITTED';
const FIRST_IMPORT_KEY = 'MMMH_FIRST_IMPORT_COMPLETED';

/**
 * Mark that the user has completed their first import.
 * Call this from the review screen after saving a recipe.
 */
export async function markFirstImportCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_IMPORT_KEY, 'true');
  } catch {
    // Ignore
  }
}

/**
 * Mark that the user has submitted feedback.
 */
export async function markFeedbackSubmitted(): Promise<void> {
  try {
    await AsyncStorage.setItem(FEEDBACK_SUBMITTED_KEY, 'true');
  } catch {
    // Ignore
  }
}

export function FeedbackPrompt() {
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(() => new Animated.Value(100))[0];
  const { width } = useWindowDimensions();

  useEffect(() => {
    checkShouldShow();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    }
  }, [visible, slideAnim]);

  const checkShouldShow = async () => {
    try {
      const [promptShown, feedbackSubmitted, firstImport] = await Promise.all([
        AsyncStorage.getItem(FEEDBACK_PROMPT_SHOWN_KEY),
        AsyncStorage.getItem(FEEDBACK_SUBMITTED_KEY),
        AsyncStorage.getItem(FIRST_IMPORT_KEY),
      ]);

      if (firstImport === 'true' && promptShown !== 'true' && feedbackSubmitted !== 'true') {
        setVisible(true);
        await AsyncStorage.setItem(FEEDBACK_PROMPT_SHOWN_KEY, 'true');
        analytics.track(EVENTS.FEEDBACK_PROMPT_SHOWN);
      }
    } catch {
      // Ignore
    }
  };

  const handleAccept = () => {
    analytics.track(EVENTS.FEEDBACK_PROMPT_ACCEPTED);
    setVisible(false);
    router.push('/feedback');
  };

  const handleDismiss = () => {
    analytics.track(EVENTS.FEEDBACK_PROMPT_DISMISSED);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { width: width - spacing.base * 2, transform: [{ translateY: slideAnim }] },
      ]}
      testID="feedback-prompt"
    >
      <View style={styles.content}>
        <View style={styles.iconRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.accent} />
          <Text style={styles.title}>Votre avis compte !</Text>
        </View>
        <Text style={styles.message}>
          Comment trouvez-vous l'app ? Partagez vos retours pour nous aider à l'améliorer.
        </Text>
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={handleAccept}
            testID="feedback-prompt-accept"
          >
            <Text style={styles.primaryButtonText}>Donner mon avis</Text>
          </Pressable>
          <Pressable onPress={handleDismiss} hitSlop={8} testID="feedback-prompt-dismiss">
            <Text style={styles.dismissText}>Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    gap: spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  primaryButtonText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.surfaceAlt,
  },
  dismissText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
