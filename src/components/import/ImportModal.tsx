import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Animated, Alert } from 'react-native';
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
      style={({ pressed }) => [styles.optionButton, pressed && styles.optionPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size="lg" color={colors.text} />
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

  const handleLinkImport = () => {
    onClose();
    router.push('/import/url');
  };

  const handleCameraImport = () => {
    Alert.alert('Importer une photo', 'Choisir une option', [
      {
        text: 'Prendre une photo',
        onPress: () => {
          onClose();
          router.push('/import/photo?source=camera');
        },
      },
      {
        text: 'Choisir dans la galerie',
        onPress: () => {
          onClose();
          router.push('/import/photo?source=gallery');
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleTextImport = () => {
    // TODO: Epic 2 - Navigate to text input
    onClose();
  };

  const handleCreateRecipe = () => {
    onClose();
    router.push('/recipe/create');
  };

  const renderMainView = () => (
    <>
      <Text style={styles.title}>Importer une recette</Text>

      <View style={styles.options}>
        <ImportOption icon="globe" label="Lien" onPress={handleLinkImport} />
        <ImportOption icon="camera" label="Photo" onPress={handleCameraImport} />
        <ImportOption icon="text" label="Texte" onPress={handleTextImport} />
      </View>

      <Text style={styles.divider}>ou</Text>

      <Pressable
        onPress={handleCreateRecipe}
        style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Créer une nouvelle recette"
      >
        <Icon name="pencil" size="md" color={colors.accent} />
        <Text style={styles.createButtonText}>Créer une nouvelle recette</Text>
      </Pressable>
    </>
  );

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
            {renderMainView()}
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
  title: {
    ...typography.titleScript,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: spacing.md,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    width: 100,
    height: 90,
    gap: spacing.sm,
  },
  optionPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  optionLabel: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    ...typography.body,
    color: colors.text,
    marginVertical: spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    width: 332,
  },
  createButtonPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  createButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.accent,
  },
});
