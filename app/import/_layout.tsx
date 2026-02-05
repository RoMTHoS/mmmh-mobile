import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function ImportLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="url"
        options={{
          title: 'Importer une recette',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="webview"
        options={{
          title: 'Naviguer vers la recette',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="photo"
        options={{
          title: 'Importer une photo',
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
