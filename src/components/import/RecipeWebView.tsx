import { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { colors } from '../../theme';

interface RecipeWebViewProps {
  initialUrl: string;
  onUrlChange?: (url: string) => void;
  onExtractHtml: (html: string, url: string) => void;
  webViewRef?: React.RefObject<WebView>;
}

export function RecipeWebView({
  initialUrl,
  onUrlChange,
  onExtractHtml,
  webViewRef: externalRef,
}: RecipeWebViewProps) {
  const internalRef = useRef<WebView>(null);
  const webViewRef = externalRef || internalRef;
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      if (navState.url && navState.url !== currentUrl) {
        setCurrentUrl(navState.url);
        onUrlChange?.(navState.url);
      }
    },
    [currentUrl, onUrlChange]
  );

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'HTML_EXTRACTED') {
          onExtractHtml(data.html, data.url);
        }
      } catch {
        // Ignore parse errors
      }
    },
    [onExtractHtml]
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
  },
});
