export default {
  expo: {
    name: 'mmmh-mobile',
    slug: 'mmmh-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'mmmh',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mmmh.mobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
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
      mixpanelToken: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '',
      analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== 'false',
      emailjsServiceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '',
      emailjsTemplateId: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || '',
      emailjsPublicKey: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '',
    },
  },
};
