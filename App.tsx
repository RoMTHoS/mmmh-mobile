import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary } from './src/components';
import { logger } from './src/utils';

// Setup global error handlers
function setupErrorHandlers(): void {
  // Handle unhandled promise rejections
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    logger.error('Unhandled global error', error, { isFatal });

    // TODO: Story 0.1 - Uncomment when Sentry is configured
    // Sentry.captureException(error, { extra: { isFatal } });

    // Call original handler (in dev, this shows the red error screen)
    if (originalHandler) {
      originalHandler(error, isFatal ?? false);
    }
  });
}

// Initialize error handlers immediately
setupErrorHandlers();

function AppContent(): React.JSX.Element {
  useEffect(() => {
    logger.info('App initialized');
  }, []);

  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
