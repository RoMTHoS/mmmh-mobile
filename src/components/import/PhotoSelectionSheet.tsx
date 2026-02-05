import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, radius, fonts } from '../../theme';
import { Icon, IconName } from '../ui';

interface PhotoOptionProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

function PhotoOption({ icon, label, onPress }: PhotoOptionProps) {
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

interface PhotoSelectionSheetProps {
  visible: boolean;
  onSelect: (source: 'camera' | 'gallery') => void;
  onClose: () => void;
}

export function PhotoSelectionSheet({ visible, onSelect, onClose }: PhotoSelectionSheetProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      backdropAnim.setValue(0);

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

  const handleCameraPress = () => {
    onSelect('camera');
  };

  const handleGalleryPress = () => {
    onSelect('gallery');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} pointerEvents="none" />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>Importer une photo</Text>

            <View style={styles.options}>
              <PhotoOption icon="camera" label="Prendre une photo" onPress={handleCameraPress} />
              <PhotoOption
                icon="image"
                label="Choisir depuis la galerie"
                onPress={handleGalleryPress}
              />
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
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
    marginBottom: spacing.lg,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flex: 1,
    maxWidth: 160,
    height: 100,
    gap: spacing.sm,
  },
  optionPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  optionLabel: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  cancelButtonPressed: {
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
  },
});
