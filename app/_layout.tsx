import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ErrorBoundary } from '../src/components';
import { useDatabase } from '../src/hooks';
import { LoadingScreen } from '../src/components/ui';

const NAVIGATION_PATH_KEY = 'NAVIGATION_PATH';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function NavigationStatePersistence() {
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const saveCurrentPath = async () => {
      try {
        await AsyncStorage.setItem(NAVIGATION_PATH_KEY, pathname);
      } catch {
        // Silently fail - navigation state persistence is not critical
      }
    };
    saveCurrentPath();
  }, [pathname]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        try {
          await AsyncStorage.setItem(NAVIGATION_PATH_KEY, pathname);
        } catch {
          // Silently fail
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [pathname]);

  return null;
}

function RootLayoutNav() {
  const { isReady: isDbReady } = useDatabase();

  if (!isDbReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationStatePersistence />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFF' },
          headerTintColor: '#D97706',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe' }} />
        <Stack.Screen
          name="recipe/[id]/edit"
          options={{ title: 'Edit Recipe', presentation: 'modal' }}
        />
        <Stack.Screen
          name="recipe/create"
          options={{ title: 'New Recipe', presentation: 'modal' }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RootLayoutNav />
      </ErrorBoundary>
      <Toast />
    </QueryClientProvider>
  );
}
