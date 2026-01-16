import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary, DatabaseTestScreen } from './src/components';
import { useDatabase } from './src/hooks';
import { logger } from './src/utils';

// Create a QueryClient instance
const queryClient = new QueryClient();

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
  const { isReady, error } = useDatabase();

  useEffect(() => {
    logger.info('App initialized');
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Database Error: {error.message}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text>Initializing database...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  // TODO: Remove DatabaseTestScreen after Story 1.5 testing is complete
  // and replace with actual app content
  return <DatabaseTestScreen />;
}

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
});
