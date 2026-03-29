import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '../../src/utils/toast';
import { GeminiFallbackDialog } from '../../src/components/import/GeminiFallbackDialog';
import { useImportStore } from '../../src/stores/importStore';
import { submitImport } from '../../src/services/import';
import { usePipelinePreCheck } from '../../src/hooks/usePipelinePreCheck';
import { usePlanStatus } from '../../src/hooks';
import * as planDb from '../../src/services/planDatabase';
import { trackEvent } from '../../src/utils/analytics';
import { colors, typography, fonts, spacing, radius } from '../../src/theme';
import { PremiumIcon } from '../../src/components/ui';
import { useQueryClient } from '@tanstack/react-query';

const MIN_TEXT_LENGTH = 10;
const MAX_TEXT_LENGTH = 15000;

export default function TextImportScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGeminiFallback, setShowGeminiFallback] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const addJob = useImportStore((state) => state.addJob);
  const jobs = useImportStore((state) => state.jobs);
  const checkPipeline = usePipelinePreCheck();
  const planStatus = usePlanStatus();

  const trimmedText = text.trim();
  const isTextValid = trimmedText.length >= MIN_TEXT_LENGTH;
  const showError = hasAttemptedSubmit && !isTextValid && trimmedText.length > 0;

  const handlePaste = useCallback(async () => {
    const clipboardText = await Clipboard.getStringAsync();
    if (!clipboardText || clipboardText.trim().length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Presse-papiers vide',
        text2: 'Le presse-papiers est vide',
      });
      return;
    }
    setText(clipboardText);
    Toast.show({
      type: 'success',
      text1: 'Texte colle',
    });
  }, []);

  const handleClear = useCallback(() => {
    setText('');
    setHasAttemptedSubmit(false);
  }, []);

  const doImport = useCallback(
    async (sourceText: string, forcePremium = false) => {
      setIsLoading(true);

      if (!forcePremium) {
        checkPipeline();
      }

      try {
        const response = await submitImport({
          importType: 'text',
          sourceText,
          ...(forcePremium ? { forcePremium: true } : {}),
        });

        addJob({
          jobId: response.jobId,
          importType: 'text',
          sourceUrl: 'text-import',
          status: response.status,
          progress: 0,
          createdAt: response.createdAt || new Date().toISOString(),
          ...(forcePremium ? { pipeline: 'gemini' as const, usageTracked: true } : {}),
        });

        // Optimistically increment local Gemini usage so the quota updates immediately
        if (forcePremium) {
          await planDb.incrementGeminiUsage();
        }

        queryClient.invalidateQueries({ queryKey: ['import-usage'] });

        Toast.show({
          type: 'success',
          text1: 'Import lance',
          text2: 'Suivez la progression sur la page principale',
        });

        router.back();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'import";
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addJob, queryClient, checkPipeline]
  );

  const handleSubmit = useCallback(() => {
    setHasAttemptedSubmit(true);

    if (!isTextValid) {
      return;
    }

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
      setShowGeminiFallback(true);
      return;
    }

    doImport(trimmedText);
  }, [isTextValid, trimmedText, jobs, planStatus, doImport]);

  const handleFallbackAccept = useCallback(() => {
    trackEvent('fallback_accepted', {});
    setShowGeminiFallback(false);
    doImport(trimmedText);
  }, [trimmedText, doImport]);

  const handleFallbackDecline = useCallback(() => {
    trackEvent('fallback_declined', {});
    setShowGeminiFallback(false);
  }, []);

  const handlePremiumImport = useCallback(() => {
    setHasAttemptedSubmit(true);

    if (!isTextValid) {
      return;
    }

    if (!planStatus || planStatus.geminiQuotaRemaining <= 0) {
      router.push('/upgrade');
      return;
    }

    if (planStatus.tier === 'premium') {
      doImport(trimmedText, true);
      return;
    }

    Alert.alert(
      'Import premium',
      `Vous voulez utiliser un de vos imports premium ? (${planStatus.geminiQuotaRemaining} restant${planStatus.geminiQuotaRemaining > 1 ? 's' : ''})`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: () => doImport(trimmedText, true),
        },
      ]
    );
  }, [isTextValid, trimmedText, planStatus, doImport]);

  const charCountColor =
    trimmedText.length > 0 && trimmedText.length < MIN_TEXT_LENGTH
      ? colors.error
      : colors.textMuted;

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
          <Text style={styles.title}>Importer depuis du texte</Text>
          <Text style={styles.subtitle}>
            Collez le texte d'une recette depuis n'importe quelle source
          </Text>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={[styles.textInput, showError && styles.textInputError]}
            placeholder="Collez votre recette ici..."
            placeholderTextColor={colors.textMuted}
            multiline
            scrollEnabled
            value={text}
            onChangeText={setText}
            maxLength={MAX_TEXT_LENGTH}
            textAlignVertical="top"
            testID="text-import-input"
          />

          <View style={styles.inputFooter}>
            {showError && (
              <Text style={styles.errorText} testID="validation-error">
                Minimum {MIN_TEXT_LENGTH} caracteres requis
              </Text>
            )}
            <Text style={[styles.charCount, { color: charCountColor }]} testID="char-counter">
              {trimmedText.length.toLocaleString('fr-FR')} /{' '}
              {MAX_TEXT_LENGTH.toLocaleString('fr-FR')}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={handlePaste}
              testID="paste-button"
            >
              <Text style={styles.actionButtonText}>Coller</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={handleClear}
              testID="clear-button"
            >
              <Text style={styles.actionButtonText}>Effacer</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + spacing.md }]}>
        {planStatus?.tier !== 'premium' && (
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              (!isTextValid || isLoading) && styles.submitButtonDisabled,
              pressed && { opacity: 0.85 },
            ]}
            disabled={isLoading}
            testID="submit-button"
          >
            <Text style={styles.submitButtonText}>Import standard</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.premiumButton, pressed && { opacity: 0.85 }]}
          onPress={handlePremiumImport}
          disabled={isLoading}
          testID="premium-button"
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
  inputSection: {
    paddingHorizontal: spacing.md,
  },
  textInput: {
    minHeight: 200,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  textInputError: {
    borderColor: colors.error,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: 20,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  charCount: {
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionButtonPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  actionButtonText: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
  },
  bottomButtons: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
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
