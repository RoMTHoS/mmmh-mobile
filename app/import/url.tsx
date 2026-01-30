import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { UrlInput } from '../../src/components/import/UrlInput';
import { useImportStore } from '../../src/stores/importStore';
import { submitImport } from '../../src/services/import';
import { detectPlatform } from '../../src/utils/validation';
import { colors, typography, spacing } from '../../src/theme';

type ImportType = 'video' | 'website';

export default function UrlInputScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const importType: ImportType = (params.type as ImportType) || 'video';

  const [isLoading, setIsLoading] = useState(false);
  const addJob = useImportStore((state) => state.addJob);
  const jobs = useImportStore((state) => state.jobs);

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

      setIsLoading(true);

      try {
        const platform = detectPlatform(url);
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
    [importType, addJob, jobs]
  );

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
          <Text style={styles.title}>
            {importType === 'video' ? 'Importer une video' : 'Importer un site'}
          </Text>
          <Text style={styles.subtitle}>
            {importType === 'video'
              ? 'Collez le lien de la video contenant la recette'
              : 'Collez le lien de la page de recette'}
          </Text>
        </View>

        <UrlInput importType={importType} onSubmit={handleSubmit} isLoading={isLoading} />
      </ScrollView>
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
});
