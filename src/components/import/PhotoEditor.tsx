import { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import { Icon } from '../ui';
import { colors, spacing, radius, fonts } from '../../theme';

interface PhotoEditorProps {
  uri: string;
  onComplete: (uri: string) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function PhotoEditor({ uri, onComplete, onSkip, onCancel }: PhotoEditorProps) {
  const insets = useSafeAreaInsets();
  const [currentUri, setCurrentUri] = useState(uri);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRotate = useCallback(async () => {
    setIsProcessing(true);
    try {
      const newRotation = (rotation + 90) % 360;
      const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: newRotation }], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setCurrentUri(result.uri);
      setRotation(newRotation);
    } catch {
      // Silently fail, keep current image
    } finally {
      setIsProcessing(false);
    }
  }, [uri, rotation]);

  const handleComplete = useCallback(() => {
    onComplete(currentUri);
  }, [currentUri, onComplete]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
          onPress={onCancel}
        >
          <Icon name="arrow-left" size="md" color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Ajuster la photo</Text>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
          onPress={onSkip}
        >
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      </View>

      {/* Image preview */}
      <View style={styles.imageContainer}>
        {isProcessing ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <Image source={{ uri: currentUri }} style={styles.image} resizeMode="contain" />
        )}
      </View>

      {/* Edit tools */}
      <View style={styles.toolsContainer}>
        <Pressable
          style={({ pressed }) => [styles.toolButton, pressed && styles.toolButtonPressed]}
          onPress={handleRotate}
          disabled={isProcessing}
        >
          <Icon name="rotate" size="lg" color={colors.text} />
          <Text style={styles.toolLabel}>Rotation</Text>
        </Pressable>
      </View>

      {/* Bottom button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [
            styles.importButton,
            pressed && styles.importButtonPressed,
            isProcessing && styles.importButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={isProcessing}
        >
          <Text style={styles.importButtonText}>Importer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 60,
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.text,
  },
  skipText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'right',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  toolsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toolButton: {
    alignItems: 'center',
    padding: spacing.md,
    minWidth: 80,
  },
  toolButtonPressed: {
    opacity: 0.7,
  },
  toolLabel: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
  },
  bottomContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  importButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  importButtonPressed: {
    backgroundColor: colors.accentLight,
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: '#FFFFFF',
  },
});
