import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '../../src/utils/toast';
import { UrlInput } from '../../src/components/import/UrlInput';
import { TrialStatusBadge } from '../../src/components/import/TrialStatusBadge';
import { QuotaDisplay } from '../../src/components/import/QuotaDisplay';
import { QuotaExceededModal } from '../../src/components/import/QuotaExceededModal';
import { GeminiFallbackDialog } from '../../src/components/import/GeminiFallbackDialog';
import { useImportStore } from '../../src/stores/importStore';
import { submitImport } from '../../src/services/import';
import { detectPlatform } from '../../src/utils/validation';
import { usePipelinePreCheck } from '../../src/hooks/usePipelinePreCheck';
import { usePlanStatus, useActivateTrial } from '../../src/hooks';
import { trackEvent } from '../../src/utils/analytics';
import { colors, typography, fonts, spacing, radius } from '../../src/theme';
import { PremiumIcon } from '../../src/components/ui';
import { PlatformBadge } from '../../src/components/import/PlatformBadge';
import { useQueryClient } from '@tanstack/react-query';

type ImportType = 'video' | 'website';

export default function UrlInputScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [showQuotaExceeded, setShowQuotaExceeded] = useState(false);
  const [showGeminiFallback, setShowGeminiFallback] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  const addJob = useImportStore((state) => state.addJob);
  const jobs = useImportStore((state) => state.jobs);
  const checkPipeline = usePipelinePreCheck();
  const planStatus = usePlanStatus();
  const activateTrial = useActivateTrial();

  const doImport = useCallback(
    async (url: string) => {
      setIsLoading(true);

      // Pre-import pipeline check (informational only)
      checkPipeline();

      // Auto-detect import type based on URL
      const platform = detectPlatform(url);
      const importType: ImportType = platform ? 'video' : 'website';

      try {
        const response = await submitImport({
          importType,
          sourceUrl: url,
        });

        // Add job to store
        addJob({
          jobId: response.jobId,
          importType,
          sourceUrl: url,
          platform: platform || response.platform,
          status: response.status,
          progress: 0,
          createdAt: response.createdAt || new Date().toISOString(),
        });

        // Refresh quota display after successful import
        queryClient.invalidateQueries({ queryKey: ['import-usage'] });

        Toast.show({
          type: 'success',
          text1: 'Import lance',
          text2: 'Suivez la progression sur la page principale',
        });

        // Navigate back to home
        router.replace('/(tabs)');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'import";

        // Check for bot detection error to trigger WebView fallback
        const errorCode = (error as { code?: string }).code;
        if (
          importType === 'website' &&
          (errorCode === 'BOT_DETECTED' || errorCode === 'ACCESS_DENIED')
        ) {
          Toast.show({
            type: 'info',
            text1: 'Site protege',
            text2: 'Ouverture du navigateur...',
          });
          router.push({
            pathname: '/import/webview',
            params: { url },
          });
          return;
        }

        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addJob, jobs, queryClient]
  );

  const handleSubmit = useCallback(
    async (url: string) => {
      // Check if we already have max jobs
      const activeJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'processing');
      if (activeJobs.length >= 3) {
        Toast.show({
          type: 'error',
          text1: 'Limite atteinte',
          text2: 'Vous avez deja 3 imports en cours',
        });
        return;
      }

      if (!planStatus) {
        doImport(url);
        return;
      }

      // VPS quota check: if exhausted, block for free and trial
      if (planStatus.vpsQuotaRemaining === 0 && planStatus.tier !== 'premium') {
        trackEvent('quota_exhausted_vps', { deviceId: '', tier: planStatus.tier });
        setShowQuotaExceeded(true);
        return;
      }

      // Gemini quota check: if exhausted for trial, offer VPS fallback
      if (
        planStatus.tier === 'trial' &&
        planStatus.geminiQuotaRemaining === 0 &&
        planStatus.vpsQuotaRemaining > 0
      ) {
        trackEvent('quota_exhausted_gemini', { deviceId: '', dayOfTrial: 0 });
        setPendingUrl(url);
        setShowGeminiFallback(true);
        return;
      }

      doImport(url);
    },
    [planStatus, jobs, doImport]
  );

  const handleFallbackAccept = useCallback(() => {
    trackEvent('fallback_accepted', {});
    setShowGeminiFallback(false);
    if (pendingUrl) {
      doImport(pendingUrl);
      setPendingUrl(null);
    }
  }, [pendingUrl, doImport]);

  const handleFallbackDecline = useCallback(() => {
    trackEvent('fallback_declined', {});
    setShowGeminiFallback(false);
    setPendingUrl(null);
  }, []);

  const handleUpgrade = useCallback(() => {
    setShowQuotaExceeded(false);
    router.push('/upgrade');
  }, []);

  const handleStartTrial = useCallback(() => {
    setShowQuotaExceeded(false);
    activateTrial.mutate();
  }, [activateTrial]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Importer depuis un lien</Text>
          <Text style={styles.subtitle}>
            Collez le lien d'une video (Instagram, TikTok, YouTube) ou d'un site de recette
          </Text>
          <View style={styles.platformHints}>
            <Text style={styles.hintsLabel}>Videos supportees :</Text>
            <View style={styles.platformList}>
              <PlatformBadge platform="instagram" size="sm" showLabel />
              <PlatformBadge platform="tiktok" size="sm" showLabel />
              <PlatformBadge platform="youtube" size="sm" showLabel />
            </View>
            <Text style={[styles.hintsLabel, { marginTop: spacing.sm }]}>
              + tout site de recette
            </Text>
          </View>
        </View>

        {planStatus?.tier === 'trial' && <TrialStatusBadge />}

        <View style={styles.quotaSection}>
          <QuotaDisplay />
        </View>

        <UrlInput
          importType="link"
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onUrlChange={setCurrentUrl}
        />
      </ScrollView>

      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={() => currentUrl.trim() && handleSubmit(currentUrl.trim())}
          style={({ pressed }) => [
            styles.standardButton,
            !isLoading ? {} : styles.standardButtonDisabled,
            pressed && { opacity: 0.85 },
          ]}
          disabled={isLoading}
        >
          <Text style={styles.standardButtonText}>Import standard</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.premiumButton, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/upgrade')}
        >
          <PremiumIcon width={24} color="#DAA520" />
          <Text style={styles.premiumButtonText}>
            {planStatus && planStatus.geminiQuotaRemaining === 0
              ? 'Passer premium'
              : 'Import premium'}
          </Text>
          <PremiumIcon width={24} color="#DAA520" />
        </Pressable>
      </View>

      <QuotaExceededModal
        visible={showQuotaExceeded}
        onClose={() => setShowQuotaExceeded(false)}
        onUpgrade={handleUpgrade}
        onStartTrial={handleStartTrial}
      />

      <GeminiFallbackDialog
        visible={showGeminiFallback}
        onAccept={handleFallbackAccept}
        onDecline={handleFallbackDecline}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.titleScript,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  platformHints: {
    marginTop: spacing.md,
  },
  hintsLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  platformList: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  quotaSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  bottomButtons: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  standardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  standardButtonDisabled: {
    opacity: 0.4,
  },
  standardButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  premiumButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: '#DAA520',
  },
});
