import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { colors, typography, spacing, radius, fonts } from '../../theme';
import { Icon, IconName } from '../ui';

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
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.optionIcon}>
        <Icon name={icon} size="lg" color={colors.text} />
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
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset to initial positions
      slideAnim.setValue(300);
      backdropAnim.setValue(0);

      // Animate both together: backdrop fades in while sheet slides up
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      // Animate both out together
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop overlay - separate from pressable for proper touch handling */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} pointerEvents="none" />
        {/* Pressable area to close modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.sheet} onPress={() => {}} /* Capture touches on sheet */>
            <View style={styles.handle} />
            <Text style={styles.title}>Importer une recette</Text>

            <View style={styles.options}>
              <ImportOption icon="globe" label="Navigateur" onPress={handleBrowserImport} />
              <ImportOption icon="camera" label="Appareil photo" onPress={handleCameraImport} />
              <ImportOption icon="text" label="Texte" onPress={handleTextImport} />
            </View>

            <Text style={styles.divider}>ou</Text>

            <Pressable
              onPress={handleCreateRecipe}
              style={styles.createLink}
              accessibilityRole="button"
              accessibilityLabel="Créer une nouvelle recette"
            >
              <Icon name="pencil" size="sm" color={colors.accent} />
              <Text style={styles.createLinkText}>Créer une nouvelle recette</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
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
  sheetContainer: {
    margin: spacing.md,
    marginBottom: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.modalBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
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
    ...typography.titleScript,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.md,
  },
  option: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    minWidth: 80,
  },
  optionPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    ...typography.body,
    color: colors.textMuted,
    marginVertical: spacing.md,
  },
  createLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  createLinkText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
});
