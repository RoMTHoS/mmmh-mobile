import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useEffect, useRef, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Button } from '../ui';
import { PlatformBadge } from './PlatformBadge';
import { PipelineBadge } from './PipelineBadge';
import { colors, typography, spacing, radius, fonts } from '../../theme';
import { extractHostname } from '../../utils/validation';
import type { ImportJob } from '../../stores/importStore';
import { useUIStore } from '../../stores/uiStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface ImportStatusCardProps {
  job: ImportJob;
  onRetry: () => void;
  onDismiss: () => void;
}

// Visual steps shown to the user with their progress thresholds
const VISUAL_STEPS = [
  { key: 'downloading', label: 'Telechargement...', targetProgress: 25 },
  { key: 'transcription', label: 'Transcription...', targetProgress: 50 },
  { key: 'structuring', label: 'Structuration...', targetProgress: 99 },
  { key: 'done', label: 'Pret !', targetProgress: 100 },
];

// How long (ms) to spend on each simulated step
const STEP_DURATIONS = [8000, 12000, 80000, 2000];

export function ImportStatusCard({ job, onRetry, onDismiss }: ImportStatusCardProps) {
  const openImportModal = useUIStore((s) => s.openImportModal);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const stepStartTimeRef = useRef<number>(0);
  const maxProgressRef = useRef(0);
  const [displayStep, setDisplayStep] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  const isDismissable = job.status === 'failed' || job.status === 'completed';

  // Simulated progress: smoothly advance through visual steps
  // Only runs when status is 'processing', pauses on 'pending'
  useEffect(() => {
    if (job.status === 'completed') {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
      maxProgressRef.current = 100;
      stepRef.current = VISUAL_STEPS.length - 1;
      setDisplayStep(VISUAL_STEPS.length - 1);
      setDisplayProgress(100);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
      return;
    }

    // Only simulate progress during 'processing', not 'pending'
    if (job.status !== 'processing') {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
      return;
    }

    // Start simulation timer if not already running
    if (simulationRef.current) return;

    if (stepStartTimeRef.current === 0) {
      stepStartTimeRef.current = Date.now();
    }

    simulationRef.current = setInterval(() => {
      const currentStepIdx = stepRef.current;

      // At last step (done), wait for backend completion
      if (currentStepIdx >= VISUAL_STEPS.length - 1) return;

      const stepElapsed = Date.now() - stepStartTimeRef.current;
      const stepDuration = STEP_DURATIONS[currentStepIdx];
      const stepFraction = Math.min(stepElapsed / stepDuration, 1);

      const prevTarget = currentStepIdx === 0 ? 0 : VISUAL_STEPS[currentStepIdx - 1].targetProgress;
      const currentTarget = VISUAL_STEPS[currentStepIdx].targetProgress;
      // Ease out: slow down as approaching step boundary
      const eased = 1 - Math.pow(1 - stepFraction, 2);
      const progress = Math.round(prevTarget + (currentTarget - prevTarget) * eased);

      // Never go backward
      if (progress < maxProgressRef.current) return;
      maxProgressRef.current = progress;

      setDisplayProgress(progress);
      Animated.timing(progressAnim, {
        toValue: progress / 100,
        duration: 200,
        useNativeDriver: false,
      }).start();

      // Move to next step when duration elapsed (but not past structuring)
      if (stepFraction >= 1 && currentStepIdx < VISUAL_STEPS.length - 2) {
        stepRef.current = currentStepIdx + 1;
        stepStartTimeRef.current = Date.now();
        setDisplayStep(currentStepIdx + 1);
      }
    }, 200);

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
    };
  }, [job.status]);

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

  const getStatusText = () => {
    if (job.status === 'pending') return 'En attente...';
    if (job.status === 'processing') {
      return VISUAL_STEPS[displayStep]?.label || 'Traitement...';
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

        {job.status === 'processing' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressText}>{displayProgress}%</Text>
          </View>
        )}

        {job.status === 'failed' && job.error?.code === 'INSTAGRAM_POST_INVALID' && (
          <Button
            title="Importer différemment"
            onPress={openImportModal}
            variant="primary"
            size="sm"
            style={styles.retryButton}
          />
        )}

        {job.status === 'failed' && job.error?.code !== 'INSTAGRAM_POST_INVALID' && (
          <Button
            title="Réessayer"
            onPress={onRetry}
            variant="primary"
            size="sm"
            style={styles.retryButton}
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
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: '#000000',
  },
  fallbackNotice: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
