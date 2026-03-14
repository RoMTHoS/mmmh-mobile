import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useEffect, useRef, useMemo } from 'react';
import { router } from 'expo-router';
import { Button } from '../ui';
import { PlatformBadge } from './PlatformBadge';
import { PipelineBadge } from './PipelineBadge';
import { colors, typography, spacing, radius, fonts } from '../../theme';
import { extractHostname } from '../../utils/validation';
import type { ImportJob } from '../../stores/importStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface ImportStatusCardProps {
  job: ImportJob;
  onRetry: () => void;
  onDismiss: () => void;
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
  analyzing_with_gemini: 'Analyse Gemini...',
  uploading_media: 'Envoi du media...',
  processing_image: "Traitement de l'image...",
  extracting_text: 'Extraction du texte...',
  detecting_speech: 'Detection de la parole...',
  complete: 'Termine!',
};

export function ImportStatusCard({ job, onRetry, onDismiss }: ImportStatusCardProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const isDismissable = job.status === 'failed' || job.status === 'completed';

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          isDismissable && Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy * 1.5),
        onMoveShouldSetPanResponderCapture: (_, g) =>
          isDismissable && Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy * 2),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: Animated.event([null, { dx: translateX }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > SWIPE_THRESHOLD || Math.abs(g.vx) > 0.5) {
            const direction = g.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
            Animated.timing(translateX, {
              toValue: direction,
              duration: 200,
              useNativeDriver: true,
            }).start(() => onDismiss());
          } else {
            Animated.spring(translateX, { toValue: 0, friction: 8, useNativeDriver: true }).start();
          }
        },
      }),
    [isDismissable, translateX, onDismiss]
  );

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

  const cardOpacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0, 1, 0],
  });

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateX }], opacity: cardOpacity }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PlatformBadge platform={job.platform} size="sm" />
          <Text style={styles.url} numberOfLines={1}>
            {extractHostname(job.sourceUrl)}
          </Text>
        </View>
        <View style={styles.badgeWrapper}>
          <PipelineBadge pipeline={job.pipeline ?? 'vps'} />
        </View>
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

        {job.status === 'completed' && job.fallbackUsed && (
          <Text style={styles.fallbackNotice}>
            Le service Premium etait temporairement indisponible. Votre recette a ete importee avec
            le pipeline standard.
          </Text>
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
    </Animated.View>
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
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -spacing.xs,
  },
  badgeWrapper: {
    alignSelf: 'center',
  },
  url: {
    flex: 1,
    marginLeft: spacing.xs,
    color: colors.textMuted,
    fontSize: 14,
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
  fallbackNotice: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
