import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '../../src/utils/toast';
import { UrlInput } from '../../src/components/import/UrlInput';
import { GeminiFallbackDialog } from '../../src/components/import/GeminiFallbackDialog';
import { useImportStore } from '../../src/stores/importStore';
import { submitImport } from '../../src/services/import';
import { detectPlatform } from '../../src/utils/validation';
import { usePipelinePreCheck } from '../../src/hooks/usePipelinePreCheck';
import { usePlanStatus } from '../../src/hooks';
import * as planDb from '../../src/services/planDatabase';
import { trackEvent } from '../../src/utils/analytics';
import {
  scrapeSocialPost,
  detectPhotoPost,
  hasOembedSupport,
  isShortUrl,
  resolveShortUrl,
} from '../../src/utils/socialScraper';
import { colors, typography, fonts, spacing, radius } from '../../src/theme';
import { PremiumIcon, Icon } from '../../src/components/ui';
import { PlatformBadge } from '../../src/components/import/PlatformBadge';
import { useQueryClient } from '@tanstack/react-query';

type ImportType = 'video' | 'website';

export default function UrlInputScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [showGeminiFallback, setShowGeminiFallback] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  const addJob = useImportStore((state) => state.addJob);
  const jobs = useImportStore((state) => state.jobs);
  const checkPipeline = usePipelinePreCheck();
  const planStatus = usePlanStatus();

  const doImport = useCallback(
    async (rawUrl: string, forcePremium = false) => {
      setIsLoading(true);

      // Resolve short URLs (fb.watch, vm.tiktok.com, etc.) on the client
      // since the VPS may not be able to follow these redirects
      let url = rawUrl;
      if (isShortUrl(rawUrl)) {
        try {
          url = await resolveShortUrl(rawUrl);
        } catch {
          url = rawUrl;
        }
      }

      // Pre-import pipeline check (informational only)
      if (!forcePremium) {
        checkPipeline();
      }

      // Auto-detect import type based on URL
      const platform = detectPlatform(url);
      const importType: ImportType = platform ? 'video' : 'website';

      // Social media posts: try oEmbed to get caption directly (fast path).
      // This works for ALL TikTok URLs (video, photo, carousel, short URLs).
      // If we get a caption, submit as text import — no need for video/website pipeline.
      if (hasOembedSupport(url)) {
        try {
          Toast.show({
            type: 'info',
            text1: 'Extraction de la description...',
          });

          const scraped = await scrapeSocialPost(url);

          if (scraped.caption) {
            const response = await submitImport({
              importType: 'text',
              sourceText: scraped.caption,
              thumbnailUrl: scraped.imageUrl || undefined,
              ...(forcePremium ? { forcePremium: true } : {}),
            });

            addJob({
              jobId: response.jobId,
              importType: 'text',
              sourceUrl: url,
              platform: platform || 'tiktok',
              status: response.status,
              progress: 0,
              createdAt: response.createdAt || new Date().toISOString(),
              ...(forcePremium ? { pipeline: 'gemini' as const, usageTracked: true } : {}),
            });

            if (forcePremium) {
              await planDb.incrementGeminiUsage();
            }

            queryClient.invalidateQueries({ queryKey: ['import-usage'] });

            Toast.show({
              type: 'success',
              text1: 'Recette extraite',
              text2: 'Traitement en cours...',
            });

            router.back();
            return;
          }
        } catch {
          // oEmbed failed — continue to normal import flow below
        }
      }

      // Photo/carousel posts without oEmbed caption: try website scraping
      const photoCheck = await detectPhotoPost(url);
      if (photoCheck.isPhoto) {
        try {
          const response = await submitImport({
            importType: 'website',
            sourceUrl: photoCheck.resolvedUrl,
            ...(forcePremium ? { forcePremium: true } : {}),
          });

          addJob({
            jobId: response.jobId,
            importType: 'website',
            sourceUrl: url,
            platform: platform || 'instagram',
            status: response.status,
            progress: 0,
            createdAt: response.createdAt || new Date().toISOString(),
            ...(forcePremium ? { pipeline: 'gemini' as const, usageTracked: true } : {}),
          });

          if (forcePremium) {
            await planDb.incrementGeminiUsage();
          }

          queryClient.invalidateQueries({ queryKey: ['import-usage'] });

          Toast.show({
            type: 'success',
            text1: 'Import lance',
            text2: 'Traitement en cours...',
          });

          router.back();
          return;
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: error instanceof Error ? error.message : "Echec de l'extraction",
          });
          setIsLoading(false);
          return;
        }
      }

      try {
        const response = await submitImport({
          importType,
          sourceUrl: url,
          ...(forcePremium ? { forcePremium: true } : {}),
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
          ...(forcePremium ? { pipeline: 'gemini' as const, usageTracked: true } : {}),
        });

        // Optimistically increment local Gemini usage so the quota updates immediately
        if (forcePremium) {
          await planDb.incrementGeminiUsage();
        }

        // Refresh quota display after successful import
        queryClient.invalidateQueries({ queryKey: ['import-usage'] });

        Toast.show({
          type: 'success',
          text1: 'Import lance',
          text2: 'Suivez la progression sur la page principale',
        });

        // Navigate to search tab where import progress is shown
        router.back();
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

      // Gemini quota check: if exhausted for trial, offer VPS fallback
      if (planStatus?.tier === 'trial' && planStatus.geminiQuotaRemaining === 0) {
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

  const handlePremiumImport = useCallback(() => {
    // No quota left → go to upgrade (no URL needed)
    if (!planStatus || planStatus.geminiQuotaRemaining <= 0) {
      router.push('/upgrade');
      return;
    }

    const url = currentUrl.trim();
    if (!url) {
      Toast.show({
        type: 'error',
        text1: 'Lien requis',
        text2: 'Collez un lien avant de lancer un import premium.',
      });
      return;
    }

    // Premium users → import directly, no confirmation needed
    if (planStatus.tier === 'premium') {
      doImport(url, true);
      return;
    }

    // Free/trial → confirm before using limited quota
    Alert.alert(
      'Import premium',
      `Vous voulez utiliser un de vos imports premium ? (${planStatus.geminiQuotaRemaining} restant${planStatus.geminiQuotaRemaining > 1 ? 's' : ''})`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: () => doImport(url, true),
        },
      ]
    );
  }, [currentUrl, planStatus, doImport]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
              <Icon name="arrow-left" size="lg" color={colors.text} />
            </Pressable>
          ),
        }}
      />
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
              Collez le lien d'une video (Instagram, TikTok, YouTube, Facebook) ou d'un site de
              recette
            </Text>
            <View style={styles.platformHints}>
              <Text style={styles.hintsLabel}>Videos supportees :</Text>
              <View style={styles.platformList}>
                <PlatformBadge platform="instagram" size="sm" showLabel />
                <PlatformBadge platform="tiktok" size="sm" showLabel />
                <PlatformBadge platform="youtube" size="sm" showLabel />
                <PlatformBadge platform="facebook" size="sm" showLabel />
              </View>
              <Text style={[styles.hintsLabel, { marginTop: spacing.sm }]}>
                + tout site de recette
              </Text>
            </View>
          </View>

          <UrlInput
            importType="link"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onUrlChange={setCurrentUrl}
          />
        </ScrollView>

        <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + spacing.md }]}>
          {planStatus?.tier !== 'premium' && (
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
          )}
          <Pressable
            style={({ pressed }) => [styles.premiumButton, pressed && { opacity: 0.85 }]}
            onPress={handlePremiumImport}
            disabled={isLoading}
          >
            <PremiumIcon width={24} color="#FFFFFF" />
            <Text style={styles.premiumButtonText}>
              {planStatus && planStatus.geminiQuotaRemaining <= 0
                ? 'Passer premium'
                : 'Import premium'}
            </Text>
            <PremiumIcon width={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <GeminiFallbackDialog
          visible={showGeminiFallback}
          onAccept={handleFallbackAccept}
          onDecline={handleFallbackDecline}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    color: '#FFFFFF',
  },
});
