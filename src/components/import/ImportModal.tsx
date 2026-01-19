import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ImportOptionProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

function ImportOption({ icon, label, onPress }: ImportOptionProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
      onPress={onPress}
    >
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={32} color={colors.text} />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </Pressable>
  );
}

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ImportModal({ visible, onClose }: ImportModalProps) {
  const handleBrowserImport = () => {
    // TODO: Epic 2 - Navigate to URL input
    onClose();
  };

  const handleCameraImport = () => {
    // TODO: Epic 2 - Open camera
    onClose();
  };

  const handleTextImport = () => {
    // TODO: Epic 2 - Navigate to text input
    onClose();
  };

  const handleCreateRecipe = () => {
    onClose();
    router.push('/recipe/create');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Importer une recette</Text>

          <View style={styles.options}>
            <ImportOption icon="globe-outline" label="Navigateur" onPress={handleBrowserImport} />
            <ImportOption
              icon="camera-outline"
              label="Appareil photo"
              onPress={handleCameraImport}
            />
            <ImportOption icon="document-text-outline" label="Texte" onPress={handleTextImport} />
          </View>

          <Text style={styles.divider}>ou</Text>

          <Pressable onPress={handleCreateRecipe} style={styles.createLink}>
            <Ionicons name="pencil-outline" size={18} color={colors.accent} />
            <Text style={styles.createLinkText}>Créer une nouvelle recette</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.lg,
  },
  option: {
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionLabel: {
    ...typography.label,
    color: colors.text,
  },
  divider: {
    ...typography.body,
    color: colors.textMuted,
    marginVertical: spacing.base,
  },
  createLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  createLinkText: {
    ...typography.body,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
});
