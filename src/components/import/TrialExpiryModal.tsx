import { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { colors, fonts, spacing, radius } from '../../theme';
import { useUserPlan } from '../../hooks';

const EXPIRY_PROMPT_KEY = 'trial_expiry_prompt_shown';

/**
 * Full-screen modal shown once after trial expires.
 * Uses AsyncStorage to track whether it has been shown.
 */
export function TrialExpiryModal() {
  const { data: plan } = useUserPlan();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!plan) return;

    // Only show if trial was used but has expired (tier reverted to free, trialStartDate exists)
    const trialWasUsed = plan.trialStartDate !== null;
    const trialExpired = plan.tier === 'free' && trialWasUsed;

    if (!trialExpired) return;

    AsyncStorage.getItem(EXPIRY_PROMPT_KEY).then((shown) => {
      if (!shown) {
        setVisible(true);
      }
    });
  }, [plan]);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(EXPIRY_PROMPT_KEY, 'true');
  };

  const handleUpgrade = () => {
    dismiss();
    router.push('/upgrade');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" testID="trial-expiry-modal">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Votre essai Premium est termine</Text>
          <Text style={styles.message}>
            Passez a Premium pour continuer a importer en haute qualite
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={handleUpgrade}
            testID="trial-expiry-upgrade"
          >
            <Text style={styles.primaryButtonText}>Passer a Premium</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={dismiss} testID="trial-expiry-dismiss">
            <Text style={styles.secondaryButtonText}>Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.modalBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: fonts.script,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.textMuted,
  },
});
