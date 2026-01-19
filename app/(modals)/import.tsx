import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';

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

export default function ImportModal() {
  const handleClose = () => {
    router.back();
  };

  const handleBrowserImport = () => {
    // TODO: Task 5 - Navigate to URL input
    handleClose();
  };

  const handleCameraImport = () => {
    // TODO: Epic 2 - Open camera
    handleClose();
  };

  const handleTextImport = () => {
    // TODO: Epic 2 - Navigate to text input
    handleClose();
  };

  const handleCreateRecipe = () => {
    handleClose();
    router.push('/recipe/create');
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Importer une recette</Text>

        <View style={styles.options}>
          <ImportOption icon="globe-outline" label="Navigateur" onPress={handleBrowserImport} />
          <ImportOption icon="camera-outline" label="Appareil photo" onPress={handleCameraImport} />
          <ImportOption icon="document-text-outline" label="Texte" onPress={handleTextImport} />
        </View>

        <Text style={styles.divider}>ou</Text>

        <Pressable onPress={handleCreateRecipe} style={styles.createLink}>
          <Ionicons name="pencil-outline" size={18} color={colors.accent} />
          <Text style={styles.createLinkText}>Créer une nouvelle recette</Text>
        </Pressable>
      </View>
    </View>
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
