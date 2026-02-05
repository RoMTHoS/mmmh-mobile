import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { Icon, Button } from '../ui';
import { PlatformBadge } from './PlatformBadge';
import { colors, typography, spacing, radius, fonts } from '../../theme';
import { extractHostname } from '../../utils/validation';
import type { ImportJob } from '../../stores/importStore';

interface ImportStatusCardProps {
  job: ImportJob;
  onDismiss: () => void;
  onRetry: () => void;
}

const STEP_LABELS: Record<string, string> = {
  queued: 'En attente...',
  downloading: 'Telechargement...',
  extracting_audio: 'Extraction audio...',
  transcribing: 'Transcription...',
  structuring: 'Structuration...',
  validating: 'Validation...',
  scraping: 'Lecture de la page...',
  parsing: 'Extraction des donnees...',
  complete: 'Termine!',
};

export function ImportStatusCard({ job, onDismiss, onRetry }: ImportStatusCardProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: job.progress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [job.progress, progressAnim]);

  const getStatusText = () => {
    if (job.status === 'pending') return 'En attente...';
    if (job.status === 'processing') {
      return STEP_LABELS[job.currentStep || ''] || job.currentStep || 'Traitement...';
    }
    if (job.status === 'completed') return 'Pret a consulter!';
    if (job.status === 'failed') return job.error?.message || 'Echec de import';
    return 'Statut inconnu';
  };

  const formatTimeRemaining = (ms?: number) => {
    if (!ms) return '';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes}min`;
  };

  const handleReview = () => {
    router.push({
      pathname: '/recipe/review',
      params: { jobId: job.jobId },
    });
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return colors.success;
      case 'failed':
        return colors.error;
      default:
        return colors.info;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <PlatformBadge platform={job.platform} size="md" />
        <Text style={styles.url} numberOfLines={1}>
          {extractHostname(job.sourceUrl)}
        </Text>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
          hitSlop={8}
        >
          <Icon name="close" size="sm" color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          {!!job.estimatedTimeRemaining && job.status === 'processing' && (
            <Text style={styles.timeRemaining}>
              {formatTimeRemaining(job.estimatedTimeRemaining)}
            </Text>
          )}
        </View>

        {(job.status === 'pending' || job.status === 'processing') && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(job.progress)}%</Text>
          </View>
        )}

        {job.status === 'failed' && job.error?.retryable && (
          <Button
            title="Reessayer"
            onPress={onRetry}
            variant="secondary"
            size="sm"
            style={styles.actionButton}
          />
        )}

        {job.status === 'failed' &&
          (job.error?.code === 'BOT_DETECTED' || job.error?.code === 'ACCESS_DENIED') && (
            <Button
              title="Ouvrir dans le navigateur"
              onPress={() =>
                router.push({
                  pathname: '/import/webview',
                  params: { url: job.sourceUrl },
                })
              }
              variant="secondary"
              size="sm"
              style={styles.actionButton}
            />
          )}

        {job.status === 'completed' && (
          <Button
            title="Voir la recette"
            onPress={handleReview}
            size="sm"
            style={styles.actionButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  url: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
  },
  dismissButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  dismissButtonPressed: {
    backgroundColor: colors.surface,
  },
  content: {},
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusText: {
    fontFamily: fonts.script,
    fontSize: 16,
  },
  timeRemaining: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
    minWidth: 35,
    textAlign: 'right',
  },
  actionButton: {
    marginTop: spacing.sm,
  },
});
