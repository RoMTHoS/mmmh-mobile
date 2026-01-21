import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../src/components';
import { useDatabase } from '../src/hooks';
import { LoadingScreen } from '../src/components/ui';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen may already be hidden
});

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
  const { isReady: isDbReady, error: dbError } = useDatabase();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const [fontsLoaded, fontError] = useFonts({
    Pacifico: require('../assets/fonts/Pacifico-Regular.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
    if (dbError) {
      console.error('Database error:', dbError);
    }
  }, [fontError, dbError]);

  useEffect(() => {
    async function hideSplash() {
      // Hide splash when ready OR when there's an error (to show error state)
      const fontsReady = fontsLoaded || fontError;
      const dbReady = isDbReady || dbError;
      if (fontsReady && dbReady) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [fontsLoaded, fontError, isDbReady, dbError]);

  // Still loading - only if no errors
  const fontsReady = fontsLoaded || fontError;
  const dbReady = isDbReady || dbError;
  if (!fontsReady || !dbReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationStatePersistence />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(modals)" options={{ headerShown: false }} />
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
    <View style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <RootLayoutNav />
        </ErrorBoundary>
        <Toast />
      </QueryClientProvider>
    </View>
  );
}
