import { View, Text, Pressable, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius } from '../../theme';
import { useUserPlan, useActivateTrial, usePlanStatus } from '../../hooks';
import { canActivateTrial } from '../../utils/planStateMachine';
import { trackEvent } from '../../utils/analytics';

export function TrialBanner() {
  const { data: plan } = useUserPlan();
  const planStatus = usePlanStatus();
  const { mutate: activateTrial, isPending } = useActivateTrial();

  // Only show for free-tier users who haven't used their trial
  if (!plan || !planStatus) return null;
  if (planStatus.tier !== 'free') return null;
  if (!canActivateTrial(plan)) return null;

  const handleActivate = () => {
    activateTrial(undefined, {
      onSuccess: () => {
        trackEvent('trial_started', { date: new Date().toISOString() });
        Toast.show({
          type: 'success',
          text1: 'Essai Premium active !',
          text2: 'Vous avez 7 jours pour tester la qualite Premium.',
          visibilityTime: 4000,
        });
      },
      onError: (error: Error) => {
        if (error.message.includes('essai gratuit')) {
          Toast.show({
            type: 'error',
            text1: 'Essai indisponible',
            text2: "L'essai a deja ete utilise pour cet appareil.",
            visibilityTime: 4000,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: "Impossible d'activer l'essai. Verifiez votre connexion.",
            visibilityTime: 4000,
          });
        }
      },
    });
  };

  return (
    <View style={styles.container} testID="trial-banner">
      <Text style={styles.text}>Essayez la qualite Premium gratuitement pendant 7 jours</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleActivate}
        disabled={isPending}
        accessibilityRole="button"
        accessibilityLabel="Activer l'essai Premium"
        testID="trial-activate-button"
      >
        <Text style={styles.buttonText}>{isPending ? 'Activation...' : 'Activer'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  text: {
    ...typography.bodySmall,
    color: colors.surfaceAlt,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...typography.buttonSmall,
    color: colors.accent,
  },
});
