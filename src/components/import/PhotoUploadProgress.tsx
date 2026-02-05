import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui';
import { colors, spacing, radius, fonts } from '../../theme';

interface PhotoUploadProgressProps {
  progress: number;
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

export function PhotoUploadProgress({
  progress,
  error,
  onRetry,
  onCancel,
}: PhotoUploadProgressProps) {
  const insets = useSafeAreaInsets();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.content}>
        {error ? (
          <>
            <View style={styles.errorIcon}>
              <Icon name="error" size={48} color={colors.error} />
            </View>
            <Text style={styles.title}>Echec de l&apos;envoi</Text>
            <Text style={styles.errorMessage}>{error}</Text>

            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
                onPress={onRetry}
              >
                <Icon name="refresh" size="md" color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Reessayer</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onCancel}
              >
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.uploadIcon}>
              <Icon name="camera" size={48} color={colors.accent} />
            </View>
            <Text style={styles.title}>Envoi en cours...</Text>
            <Text style={styles.subtitle}>
              Veuillez patienter pendant l&apos;envoi de votre photo
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
    maxWidth: 320,
  },
  uploadIcon: {
    marginBottom: spacing.lg,
  },
  errorIcon: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorMessage: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.md,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButtonPressed: {
    backgroundColor: colors.accentLight,
  },
  primaryButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
  },
});
