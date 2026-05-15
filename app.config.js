export default {
  expo: {
    name: 'MMMH',
    slug: 'mmmh',
    version: '1.0.2',
    orientation: 'portrait',
    icon: './assets/branding/icon-ios.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'mmmh',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mmmh.mobile',
      buildNumber: '8',
      infoPlist: {
        CFBundleDevelopmentRegion: 'fr',
        NSCameraUsageDescription:
          "MMMH utilise votre appareil photo pour prendre en photo les recettes que vous souhaitez sauvegarder. Par exemple, photographiez une page de livre de cuisine et MMMH extrait automatiquement la liste des ingrédients et les étapes de préparation dans une recette enregistrée dans l'application.",
        NSPhotoLibraryUsageDescription:
          "MMMH accède à votre photothèque pour que vous puissiez importer des photos de recettes existantes. Par exemple, sélectionnez une capture d'écran d'une recette et MMMH extrait automatiquement ses ingrédients et ses étapes de préparation dans une recette enregistrée dans l'application.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/branding/icon-android-foreground.png',
        backgroundImage: './assets/branding/icon-android-background.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.mmmh.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/branding/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#fff8e7',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '166a3ea3-7bad-4f4c-a9ab-936954da991c',
      },
      mixpanelToken: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '',
      analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== 'false',
      emailjsServiceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '',
      emailjsTemplateId: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || '',
      emailjsPublicKey: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '',
      devSkipOnboarding: process.env.DEV_SKIP_ONBOARDING === 'true',
    },
  },
};
