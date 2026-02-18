import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { canActivateTrial } from '../../utils/planStateMachine';
import { useUserPlan } from '../../hooks/usePlan';

interface QuotaExceededModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onStartTrial?: () => void;
}

export function QuotaExceededModal({
  visible,
  onClose,
  onUpgrade,
  onStartTrial,
}: QuotaExceededModalProps) {
  const { data: plan } = useUserPlan();
  const showTrialOption = plan ? canActivateTrial(plan) : false;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay} testID="quota-exceeded-modal">
        <View style={styles.content}>
          <Text style={styles.title} testID="quota-exceeded-title">
            Quota d'imports atteint
          </Text>
          <Text style={styles.message} testID="quota-exceeded-message">
            Vous avez utilisé vos 10 imports gratuits cette semaine.
          </Text>
          <Text style={styles.submessage} testID="quota-exceeded-submessage">
            Revenez lundi ou passez à Premium pour des imports illimités.
          </Text>
          <View style={styles.buttons}>
            <Pressable
              style={styles.primaryButton}
              onPress={onUpgrade}
              testID="quota-exceeded-upgrade"
            >
              <Text style={styles.primaryButtonText}>Passer à Premium</Text>
            </Pressable>
            {showTrialOption && onStartTrial && (
              <Pressable
                style={styles.secondaryButton}
                onPress={onStartTrial}
                testID="quota-exceeded-trial"
              >
                <Text style={styles.secondaryButtonText}>Essayer Premium gratuitement</Text>
              </Pressable>
            )}
            <Pressable style={styles.closeButton} onPress={onClose} testID="quota-exceeded-close">
              <Text style={styles.closeButtonText}>Fermer</Text>
            </Pressable>
          </View>
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
  content: {
    backgroundColor: colors.modalBackground,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  submessage: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.label,
    color: colors.surfaceAlt,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.label,
    color: colors.accent,
  },
  closeButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
