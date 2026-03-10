import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, router, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastProvider } from '../src/components/ui/Toast';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../src/components';
import { useDatabase, useTrialExpiration, useAnalyticsSync } from '../src/hooks';
import { TrialExpiryModal } from '../src/components/import/TrialExpiryModal';
import { SubscriptionExpiryModal } from '../src/components/import/SubscriptionExpiryModal';
import { FeedbackPrompt } from '../src/components/feedback/FeedbackPrompt';
import {
  initDeviceId,
  ensurePlanSyncedToBackend,
  handleCustomerInfoUpdate,
  syncPlan,
} from '../src/services/planSync';
import { initRevenueCat, addEntitlementListener } from '../src/services/revenueCat';
import { analytics } from '../src/services/analytics';
import { EVENTS } from '../src/utils/analyticsEvents';
import { LoadingScreen } from '../src/components/ui';
import { colors } from '../src/theme';
import { shouldShowOnboarding } from './onboarding';

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
    analytics.track('Screen Viewed', { screen_name: pathname });
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

function TrialExpirationWatcher() {
  useTrialExpiration();
  return null;
}

function AnalyticsSyncWatcher() {
  useAnalyticsSync();
  return null;
}

function RootLayoutNav() {
  const { isReady: isDbReady, error: dbError } = useDatabase();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Overlock: require('../assets/fonts/Overlock-Black.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Chicle: require('../assets/fonts/Chicle-Regular.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Shanti: require('../assets/fonts/Shanti-Regular.ttf'),
  });

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    async function initServices() {
      const deviceId = await initDeviceId();

      // Initialize RevenueCat SDK (graceful failure — app continues in degraded mode)
      try {
        await initRevenueCat(deviceId);
      } catch {
        // Logged inside initRevenueCat — continue without RC
      }

      await analytics.initialize();
      analytics.identify(deviceId);
      analytics.track(EVENTS.APP_OPENED);
      ensurePlanSyncedToBackend();

      // Set up RevenueCat listener for real-time entitlement changes
      removeListener = addEntitlementListener((customerInfo) => {
        handleCustomerInfoUpdate(customerInfo).then(() => {
          queryClient.invalidateQueries({ queryKey: ['user-plan'] });
        });
      });

      const showOnboarding = await shouldShowOnboarding();
      setNeedsOnboarding(showOnboarding);
    }
    initServices();

    // Sync plan on every foreground return (lightweight — checks RevenueCat entitlement)
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncPlan()
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['user-plan'] });
          })
          .catch(() => {
            // Silently fail — will retry on next foreground
          });
      }
    });

    return () => {
      removeListener?.();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (fontError) {
      // eslint-disable-next-line no-console
      console.error('Font loading error:', fontError);
    }
    if (dbError) {
      // eslint-disable-next-line no-console
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

  // Navigate to onboarding when ready and needed
  useEffect(() => {
    if (needsOnboarding === true) {
      router.replace('/onboarding');
    }
  }, [needsOnboarding]);

  // Still loading - only if no errors
  const fontsReady = fontsLoaded || fontError;
  const dbReady = isDbReady || dbError;
  if (!fontsReady || !dbReady || needsOnboarding === null) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationStatePersistence />
      <TrialExpirationWatcher />
      <AnalyticsSyncWatcher />
      <TrialExpiryModal />
      <SubscriptionExpiryModal />
      <FeedbackPrompt />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="splash" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ title: '', headerShown: false }} />
        <Stack.Screen name="(modals)" options={{ headerShown: false }} />
        <Stack.Screen name="import" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ title: '' }} />
        <Stack.Screen
          name="recipe/[id]/edit"
          options={{ title: '', presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="recipe/create"
          options={{ title: '', presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="feedback" options={{ title: 'Feedback', headerBackTitle: ' ' }} />
        <Stack.Screen name="upgrade" options={{ title: '', headerBackTitle: ' ' }} />
        <Stack.Screen name="+not-found" options={{ title: '' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <RootLayoutNav />
        </ErrorBoundary>
        <ToastProvider />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
