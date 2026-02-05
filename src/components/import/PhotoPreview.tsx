import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui';
import { colors, spacing, radius, fonts } from '../../theme';

interface PhotoPreviewProps {
  uri: string;
  onRetake: () => void;
  onUsePhoto: () => void;
}

export function PhotoPreview({ uri, onRetake, onUsePhoto }: PhotoPreviewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onRetake}
        >
          <Icon name="refresh" size="md" color={colors.text} />
          <Text style={styles.secondaryButtonText}>Reprendre</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
          onPress={onUsePhoto}
        >
          <Icon name="check" size="md" color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Utiliser cette photo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    minWidth: 140,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButtonPressed: {
    backgroundColor: colors.accentLight,
  },
  secondaryButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
  },
  primaryButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
