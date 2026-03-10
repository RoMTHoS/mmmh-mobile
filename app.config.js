export default {
  expo: {
    name: 'mmmh',
    slug: 'mmmh',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'mmmh',
    splash: {
      image: './assets/branding/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#fff8e7',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mmmh.mobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#fff8e7',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.mmmh.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: ['expo-router', 'expo-font'],
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
