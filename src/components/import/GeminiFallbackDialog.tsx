import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

interface GeminiFallbackDialogProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function GeminiFallbackDialog({ visible, onAccept, onDecline }: GeminiFallbackDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay} testID="gemini-fallback-dialog">
        <View style={styles.content}>
          <Text style={styles.title} testID="gemini-fallback-title">
            Import premium utilisé
          </Text>
          <Text style={styles.message} testID="gemini-fallback-message">
            Vous avez utilisé votre import premium du jour.
          </Text>
          <Text style={styles.submessage}>Voulez-vous importer avec la qualité standard ?</Text>
          <View style={styles.buttons}>
            <Pressable
              style={styles.primaryButton}
              onPress={onAccept}
              testID="gemini-fallback-accept"
            >
              <Text style={styles.primaryButtonText}>Importer en standard</Text>
            </Pressable>
            <Pressable
              style={styles.closeButton}
              onPress={onDecline}
              testID="gemini-fallback-decline"
            >
              <Text style={styles.closeButtonText}>Annuler</Text>
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
  closeButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
