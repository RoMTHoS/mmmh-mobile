import { useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { Icon, Button } from '../../src/components/ui';
import { useImportStore } from '../../src/stores/importStore';
import { submitImport } from '../../src/services/import';
import { extractHostname } from '../../src/utils/validation';
import { colors, typography, spacing, radius, fonts } from '../../src/theme';

export default function WebViewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ url: string }>();
  const initialUrl = params.url || '';

  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const addJob = useImportStore((state) => state.addJob);

  const handleExtractRecipe = useCallback(() => {
    setIsExtracting(true);

    const injectedJs = `
      (function() {
        try {
          const html = document.documentElement.outerHTML;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'HTML_EXTRACTED',
            html: html,
            url: window.location.href
          }));
        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            message: error.message
          }));
        }
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(injectedJs);
  }, []);

  const handleMessage = useCallback(
    async (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'HTML_EXTRACTED') {
          try {
            const response = await submitImport({
              importType: 'website',
              sourceUrl: data.url || currentUrl,
              html: data.html,
            });

            addJob({
              jobId: response.jobId,
              importType: 'website',
              sourceUrl: data.url || currentUrl,
              platform: undefined,
              status: response.status,
              progress: 0,
              createdAt: response.createdAt || new Date().toISOString(),
            });

            Toast.show({
              type: 'success',
              text1: 'Recette extraite',
              text2: 'Traitement en cours...',
            });

            router.replace('/(tabs)');
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Erreur',
              text2: error instanceof Error ? error.message : "Echec de l'extraction",
            });
          }
        } else if (data.type === 'ERROR') {
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: data.message || "Echec de l'extraction HTML",
          });
        }
      } catch {
        // Ignore parse errors
      } finally {
        setIsExtracting(false);
      }
    },
    [currentUrl, addJob]
  );

  const handleGoBack = () => webViewRef.current?.goBack();
  const handleGoForward = () => webViewRef.current?.goForward();
  const handleReload = () => webViewRef.current?.reload();

  if (!initialUrl) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size="lg" color={colors.error} />
        <Text style={styles.errorText}>URL manquante</Text>
        <Button title="Retour" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {extractHostname(currentUrl)}
            </Text>
          ),
        }}
      />

      {/* Navigation toolbar */}
      <View style={styles.toolbar}>
        <Pressable
          onPress={handleGoBack}
          disabled={!canGoBack}
          style={({ pressed }) => [
            styles.toolbarButton,
            !canGoBack && styles.toolbarButtonDisabled,
            pressed && styles.toolbarButtonPressed,
          ]}
        >
          <Icon name="arrow-left" size="md" color={canGoBack ? colors.text : colors.textLight} />
        </Pressable>

        <Pressable
          onPress={handleGoForward}
          disabled={!canGoForward}
          style={({ pressed }) => [
            styles.toolbarButton,
            !canGoForward && styles.toolbarButtonDisabled,
            pressed && styles.toolbarButtonPressed,
          ]}
        >
          <Icon name="arrow-left" size="md" color={canGoForward ? colors.text : colors.textLight} />
        </Pressable>

        <Pressable
          onPress={handleReload}
          style={({ pressed }) => [styles.toolbarButton, pressed && styles.toolbarButtonPressed]}
        >
          <Icon name="refresh" size="md" color={colors.text} />
        </Pressable>

        <View style={styles.urlContainer}>
          <Text style={styles.urlText} numberOfLines={1}>
            {extractHostname(currentUrl)}
          </Text>
        </View>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={styles.webview}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCanGoForward(navState.canGoForward);
          if (navState.url) {
            setCurrentUrl(navState.url);
          }
        }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
      />

      {/* Extract button */}
      <View style={[styles.extractContainer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text style={styles.extractHint}>
          Naviguez vers la page de la recette, puis appuyez sur le bouton ci-dessous
        </Text>
        <Button
          title="Extraire la recette"
          onPress={handleExtractRecipe}
          loading={isExtracting}
          disabled={isExtracting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.titleScript,
    color: colors.error,
  },
  headerTitle: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.text,
    maxWidth: 200,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  toolbarButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
  toolbarButtonPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  urlContainer: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  urlText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  webview: {
    flex: 1,
  },
  extractContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  extractHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
